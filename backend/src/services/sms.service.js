// SMS илгээх сервис — одоогоор STUB (жинхэнэ SMS gateway холбогдоогүй байгаа тул зөвхөн лог бичнэ).
// Жинхэнэ gateway (жишээ нь Мессежийн үйлчилгээ үзүүлэгч) авмагц энэ функцийн дотор
// тухайн gateway-ийн fetch() дуудлагаар сольж болно — дуудагч тал (contact.controller.js) өөрчлөгдөхгүй.
export async function sendSms({ to, message }) {
  if (!to) {
    return { success: false, provider: 'stub', error: 'Утасны дугаар байхгүй' };
  }

  console.log(`📱 [SMS STUB] → ${to}: ${message}`);

  return { success: true, provider: 'stub' };
}
