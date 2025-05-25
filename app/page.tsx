import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/home/ban-hang');
  return null;
}
