import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CookieBar from "@/components/CookieBar";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <CookieBar />
    </>
  );
}
