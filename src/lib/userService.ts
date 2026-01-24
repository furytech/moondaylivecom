import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import type { MoonSignResult } from "./moonSign";

export interface UserSignup {
  email: string;
  birthDate: string;
  moonSign: MoonSignResult;
  createdAt: ReturnType<typeof serverTimestamp>;
}

export async function saveUserSignup(
  email: string,
  birthDate: Date,
  moonSign: MoonSignResult
): Promise<string> {
  const docRef = await addDoc(collection(db, "signups"), {
    email: email.trim().toLowerCase(),
    birthDate: birthDate.toISOString(),
    moonSign: {
      sign: moonSign.sign,
      symbol: moonSign.symbol,
      element: moonSign.element,
    },
    createdAt: serverTimestamp(),
  });
  
  return docRef.id;
}
