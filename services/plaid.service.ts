import { plaidClient } from '@/lib/plaid/client';
import { createClient } from '@/lib/supabase/server';
import {
  CountryCode,
  Products,
  PlaidEnvironments,
} from 'plaid';

export interface CreateLinkTokenResult {
  link_token: string | null;
  error: any;
}

export interface ExchangePublicTokenResult {
  access_token: string | null;
  item_id: string | null;
  bank_connection_id: string | null;
  error: any;
}

export interface SyncTransactionsResult {
  added: any[];
  modified: any[];
  removed: any[];
  error: any;
}

export interface HandleWebhookResult {
  success: boolean;
  error: any;
}

export async function createLinkToken(userId: string): Promise<CreateLinkTokenResult> {
  try {
    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: userId,
      },
      client_name: 'Budget App',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    });

    return {
      link_token: response.data.link_token,
      error: null,
    };
  } catch (error: any) {
    console.error('Error creating link token:', error);
    return {
      link_token: null,
      error: error.response?.data || error.message,
    };
  }
}

export async function exchangePublicToken(
  userId: string,
  publicToken: string
): Promise<ExchangePublicTokenResult> {
  try {
    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    // Get institution info
    const itemResponse = await plaidClient.itemGet({
      access_token: accessToken,
    });

    const institutionId = itemResponse.data.item.institution_id;

    let institutionName = 'Unknown Bank';
    if (institutionId) {
      const institutionResponse = await plaidClient.institutionsGetById({
        institution_id: institutionId,
        country_codes: [CountryCode.Us],
      });
      institutionName = institutionResponse.data.institution.name;
    }

    // Store bank connection in database
    const supabase = createClient();

    // Encrypt access token using Supabase Vault (pgsodium)
    const { data: bankConnection, error: dbError } = await supabase
      .from('bank_connections')
      .insert({
        user_id: userId,
        plaid_access_token: accessToken, // Will be encrypted by DB trigger
        plaid_item_id: itemId,
        institution_name: institutionName,
        account_type: 'checking', // Default, can be updated later
        connection_status: 'active',
        last_sync_date: null,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error storing bank connection:', dbError);
      return {
        access_token: null,
        item_id: null,
        bank_connection_id: null,
        error: dbError,
      };
    }

    return {
      access_token: accessToken,
      item_id: itemId,
      bank_connection_id: bankConnection.id,
      error: null,
    };
  } catch (error: any) {
    console.error('Error exchanging public token:', error);
    return {
      access_token: null,
      item_id: null,
      bank_connection_id: null,
      error: error.response?.data || error.message,
    };
  }
}

export async function syncTransactions(
  userId: string,
  bankConnectionId: string
): Promise<SyncTransactionsResult> {
  try {
    const supabase = createClient();

    // Get bank connection with decrypted access token
    const { data: bankConnection, error: fetchError } = await supabase
      .from('bank_connections')
      .select('*')
      .eq('id', bankConnectionId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !bankConnection) {
      return {
        added: [],
        modified: [],
        removed: [],
        error: fetchError || 'Bank connection not found',
      };
    }

    // Get last sync cursor (if exists)
    const { data: syncStatus } = await supabase
      .from('bank_connections')
      .select('sync_cursor')
      .eq('id', bankConnectionId)
      .single();

    let cursor = syncStatus?.sync_cursor || undefined;
    let hasMore = true;
    const allAdded: any[] = [];
    const allModified: any[] = [];
    const allRemoved: any[] = [];

    // Sync transactions using Plaid Transactions Sync API
    while (hasMore) {
      const response = await plaidClient.transactionsSync({
        access_token: bankConnection.plaid_access_token,
        cursor: cursor,
      });

      allAdded.push(...response.data.added);
      allModified.push(...response.data.modified);
      allRemoved.push(...response.data.removed);

      hasMore = response.data.has_more;
      cursor = response.data.next_cursor;
    }

    // Import transactions (will be handled by transaction service)
    // For now, just return the raw Plaid data

    // Update sync cursor and last sync date
    await supabase
      .from('bank_connections')
      .update({
        sync_cursor: cursor,
        last_sync_date: new Date().toISOString(),
      })
      .eq('id', bankConnectionId);

    return {
      added: allAdded,
      modified: allModified,
      removed: allRemoved,
      error: null,
    };
  } catch (error: any) {
    console.error('Error syncing transactions:', error);
    return {
      added: [],
      modified: [],
      removed: [],
      error: error.response?.data || error.message,
    };
  }
}

export async function handleWebhook(
  payload: any,
  signature?: string
): Promise<HandleWebhookResult> {
  try {
    // TODO: Verify webhook signature
    // const isValid = verifyWebhookSignature(payload, signature);
    // if (!isValid) {
    //   return { success: false, error: 'Invalid webhook signature' };
    // }

    const webhookType = payload.webhook_type;
    const webhookCode = payload.webhook_code;

    if (webhookType === 'TRANSACTIONS' && webhookCode === 'TRANSACTIONS_UPDATE') {
      // Handle transaction updates
      const itemId = payload.item_id;

      // Find bank connection by item_id
      const supabase = createClient();
      const { data: bankConnection } = await supabase
        .from('bank_connections')
        .select('*')
        .eq('plaid_item_id', itemId)
        .single();

      if (bankConnection) {
        // Trigger sync for this connection
        await syncTransactions(bankConnection.user_id, bankConnection.id);
      }
    } else if (webhookType === 'ITEM' && webhookCode === 'ERROR') {
      // Handle item errors (e.g., requires reauth)
      const itemId = payload.item_id;
      const errorCode = payload.error?.error_code;

      if (errorCode === 'ITEM_LOGIN_REQUIRED') {
        // Update connection status to needs_reauth
        const supabase = createClient();
        await supabase
          .from('bank_connections')
          .update({ connection_status: 'needs_reauth' })
          .eq('plaid_item_id', itemId);
      }
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error handling webhook:', error);
    return { success: false, error: error.message };
  }
}
