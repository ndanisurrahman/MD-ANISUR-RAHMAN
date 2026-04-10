const TELEGRAM_BOT_TOKEN = '8752210837:AAESyx9E-mDeZ2QfqM_S-lLBzKAj-KN3I9s';
const TELEGRAM_CHAT_ID = '7230573316';

export async function sendTelegramNotification(message: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    });
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
  }
}
