// utils/telegram.ts
// Utility functions for Telegram Bot integration

interface TelegramInlineKeyboardButton {
  text: string;
  url?: string;
  callback_data?: string;
}

interface TelegramInlineKeyboardMarkup {
  inline_keyboard: TelegramInlineKeyboardButton[][];
}

export interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode?: "Markdown" | "HTML";
  reply_markup?: TelegramInlineKeyboardMarkup;
}

export function getTelegramBotToken(): string | null {
  const token = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
  if (!token || token.includes("<your")) {
    return null;
  }
  return token;
}

export function getTelegramAdminChatId(): string | null {
  const chatId = process.env.NEXT_PUBLIC_TELEGRAM_ADMIN_CHAT_ID;
  if (!chatId || chatId.includes("<admin")) {
    return null;
  }
  return chatId;
}

export function isTelegramConfigured(): boolean {
  return getTelegramBotToken() !== null && getTelegramAdminChatId() !== null;
}

/**
 * Send a message via Telegram Bot API
 */
export async function sendTelegramMessage(
  message: TelegramMessage
): Promise<{ success: boolean; error?: string }> {
  const token = getTelegramBotToken();
  
  if (!token) {
    console.warn("Telegram bot token not configured");
    return { success: false, error: "Telegram bot token not configured" };
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      console.error("Telegram API error:", data);
      return { 
        success: false, 
        error: data.description || "Failed to send Telegram message" 
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending Telegram message:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Send notification to admin about new user pending approval
 */
export async function notifyAdminNewUser(userData: {
  nama: string;
  pangkat: string;
  nrpNip: string;
  satfung: string;
  clientName: string;
}): Promise<{ success: boolean; error?: string }> {
  const chatId = getTelegramAdminChatId();
  
  if (!chatId) {
    console.warn("Telegram admin chat ID not configured");
    return { success: false, error: "Telegram admin chat ID not configured" };
  }

  const message = `
🔔 *Permohonan Persetujuan User Baru*

👤 *Nama:* ${userData.nama}
🎖️ *Pangkat:* ${userData.pangkat}
🆔 *NRP/NIP:* ${userData.nrpNip}
📍 *Satfung:* ${userData.satfung}
🏢 *Client:* ${userData.clientName}

Silakan periksa dashboard untuk menyetujui atau menolak user ini.
  `.trim();

  return sendTelegramMessage({
    chat_id: chatId,
    text: message,
    parse_mode: "Markdown",
  });
}

/**
 * Send notification about user approval status
 */
export async function notifyUserApprovalStatus(
  chatId: string,
  userData: {
    nama: string;
    nrpNip: string;
    status: "approved" | "rejected";
    reason?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const statusEmoji = userData.status === "approved" ? "✅" : "❌";
  const statusText = userData.status === "approved" ? "Disetujui" : "Ditolak";
  
  let message = `
${statusEmoji} *Permohonan Akun ${statusText}*

👤 *Nama:* ${userData.nama}
🆔 *NRP/NIP:* ${userData.nrpNip}
📊 *Status:* ${statusText}
  `.trim();

  if (userData.reason) {
    message += `\n\n💬 *Alasan:* ${userData.reason}`;
  }

  return sendTelegramMessage({
    chat_id: chatId,
    text: message,
    parse_mode: "Markdown",
  });
}
