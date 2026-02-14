import Checkout from '@/features/booking/components/Checkout';

function CheckoutPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <Checkout />
      </div>
    </div>
  );
}

export default CheckoutPage;
