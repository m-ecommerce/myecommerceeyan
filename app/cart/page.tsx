"use client";

import { useCartStore } from '../../store/cartStore'; 
import { createClient } from '@supabase/supabase-js';
import { ShoppingCart, Trash2, ArrowLeft, Ticket, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const supabaseUrl = 'https://rbrqfecmdofvclvkhwuc.supabase.co';
const supabaseAnonKey = 'sb_publishable_WLNE9XA6NI5jarNBEJ_Phw_K195cum1';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 🎫 কুপন কোডের তালিকা
const AVAILABLE_COUPONS: { [key: string]: { type: 'percentage' | 'fixed'; value: number; minOrder: number } } = {
  'EYAN20': { type: 'percentage', value: 20, minOrder: 500 }, 
  'SAVE100': { type: 'fixed', value: 100, minOrder: 1000 },  
};

export default function CartPage() {
  const router = useRouter();
  const { items, increaseQuantity, decreaseQuantity, removeFromCart, clearCart, totalPrice } = useCartStore() as any;

  // কাস্টমার ইনফো স্টেট
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);

  // 🎟️ কুপন কোড স্টেটসমূহ
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState('');

  // 🔔 কার্ট ওয়ার্নিং টোস্ট স্টেট
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const originalTotal = totalPrice();

  // কাস্টম টোস্ট মেসেজ ফাংশন
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // কুপন অ্যাপ্লাই করার লজিক
  const handleApplyCoupon = () => {
    setCouponError('');
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponError('অনুগ্রহ করে একটি কুপন কোড লিখুন!');
      return;
    }
    const coupon = AVAILABLE_COUPONS[code];
    if (!coupon) {
      setCouponError('দুঃখিত, কুপন কোডটি সঠিক নয়!');
      setDiscountAmount(0);
      setAppliedCoupon(null);
      return;
    }
    if (originalTotal < coupon.minOrder) {
      setCouponError(`এই কুপনটি ব্যবহার করতে ন্যূনতম ৳${coupon.minOrder} টাকার অর্ডার প্রয়োজন!`);
      setDiscountAmount(0);
      setAppliedCoupon(null);
      return;
    }
    if (coupon.type === 'percentage') {
      setDiscountAmount((originalTotal * coupon.value) / 100);
    } else if (coupon.type === 'fixed') {
      setDiscountAmount(coupon.value);
    }
    setAppliedCoupon(code);
    setCouponInput('');
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponError('');
  };

  const finalTotal = Math.max(0, originalTotal - discountAmount);

  // ➕ কোয়ান্টিটি বাড়ানোর সময় লিমিট চেক করার ফাংশন
  const handleIncrease = (item: any) => {
    // যদি কার্টের কোয়ান্টিটি ডাটাবেজের স্টকের সমান বা বেশি হয়ে যায়
    if (item.quantity >= item.stock) {
      triggerToast(`দুঃখিত, এই প্রোডাক্টটি স্টকে আর মাত্র ${item.stock}টিই অবশিষ্ট আছে!`);
      return;
    }
    increaseQuantity(item.id);
  };

  // অর্ডার সাবমিট করার লজিক
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return alert('আপনার কার্টটি খালি!');
    if (!name || !phone || !address) return alert('অনুগ্রহ করে সবগুলো তথ্য পূরণ করুন!');

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([
          {
            customer_name: name,
            phone: phone,
            address: address,
            payment_method: paymentMethod,
            total_price: finalTotal, 
            items: items, 
          }
        ]);

      if (error) throw error;

      alert(`ধন্যবাদ ${name}! আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে।`);
      clearCart();
      router.push('/');
    } catch (err) {
      console.error(err);
      alert('অর্ডার করতে সমস্যা হয়েছে, আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
        <ShoppingCart size={64} className="text-gray-300 animate-bounce" />
        <h2 className="text-xl font-bold text-gray-700">আপনার শপিং কার্টটি খালি!</h2>
        <Link href="/" className="bg-black text-white px-6 py-3 rounded-2xl font-medium shadow-sm flex items-center gap-2">
          <ArrowLeft size={16} /> কেনাকাটা করুন
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 relative">
      
      {/* 🛑 স্টক লিমিট ওয়ার্নিং টোস্ট */}
      <div className={`fixed top-6 right-6 z-50 transform transition-all duration-500 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl bg-amber-50 border border-amber-200 text-amber-900 ${
        showToast ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-12 opacity-0 scale-90 pointer-events-none'
      }`}>
        <AlertTriangle className="text-amber-500 flex-shrink-0" size={20} />
        <span className="text-sm font-bold">{toastMessage}</span>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* 🛒 বাম পাশ: কার্ট আইটেমের লিস্ট */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <h2 className="text-xl font-black text-gray-800">Shopping Cart ({items.length})</h2>
            <button onClick={clearCart} className="text-xs text-red-500 font-bold hover:underline flex items-center gap-1">
              <Trash2 size={14} /> Clear All
            </button>
          </div>

          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
            {items.map((item: any) => (
              <div key={item.id} className="flex gap-4 items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <img src={item.image_url} alt={item.name} className="w-16 h-16 object-cover rounded-xl" />
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-gray-800 line-clamp-1">{item.name}</h4>
                  <p className="text-xs text-blue-600 font-bold mt-0.5">Size: {item.size || 'M'}</p>
                  {/* 📦 কার্টের ভেতরে ম্যাক্সিমাম স্টক কত তা ইউজারকে রিমাইন্ডার দেওয়া হচ্ছে */}
                  <p className="text-[10px] text-gray-400 font-medium">Available Stock: {item.stock} items</p>
                  <p className="text-sm font-black text-gray-900 mt-1">৳{item.price * item.quantity}</p>
                </div>
                
                {/* কোয়ান্টিটি বাটনসমূহ */}
                <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-xl border">
                  <button onClick={() => decreaseQuantity(item.id)} className="px-2 py-0.5 text-gray-500 hover:text-black font-bold">-</button>
                  <span className="text-xs font-bold text-gray-800 w-4 text-center">{item.quantity}</span>
                  {/* 🛠️ প্লাস বাটনে আমাদের নতুন লিমিট ফাংশন যুক্ত করা হয়েছে */}
                  <button onClick={() => handleIncrease(item)} className="px-2 py-0.5 text-gray-500 hover:text-black font-bold">+</button>
                </div>
              </div>
            ))}
          </div>

          {/* 🎟️ কুপন কোড ইনপুট সেকশন */}
          <div className="border-t pt-6 space-y-3">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <Ticket size={16} className="text-gray-700" /> Apply Promo Code
            </h3>
            {!appliedCoupon ? (
              <div className="flex gap-2">
                <input type="text" placeholder="যেমন: EYAN20" className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-black text-sm uppercase font-semibold" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} />
                <button onClick={handleApplyCoupon} className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-black transition">Apply</button>
              </div>
            ) : (
              <div className="flex justify-between items-center bg-green-50 border border-green-200 p-3 rounded-xl text-sm">
                <div className="flex items-center gap-2 text-green-700 font-semibold">
                  <CheckCircle size={16} />
                  <span>কুপন `{appliedCoupon}` সফলভাবে যুক্ত হয়েছে!</span>
                </div>
                <button onClick={handleRemoveCoupon} className="text-xs text-red-500 hover:underline font-bold">Remove</button>
              </div>
            )}
            {couponError && (
              <div className="flex items-center gap-1.5 text-xs text-red-500 font-medium bg-red-50 p-2 rounded-xl">
                <AlertCircle size={14} />
                <span>{couponError}</span>
              </div>
            )}
          </div>

          {/* প্রাইজ ব্রেকডাউন সামারি */}
          <div className="border-t pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span className="font-semibold">৳{originalTotal}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Discount:</span>
                <span>- ৳{discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-gray-900 pt-2 border-t border-dashed">
              <span>Total Payable:</span>
              <span className="text-xl text-black">৳{finalTotal}</span>
            </div>
          </div>
        </div>

        {/* 📋 ডান পাশ: চেকআউট ফর্ম */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-black text-gray-800 border-b pb-4 mb-6">Delivery & Checkout</h2>
          <form onSubmit={handleCheckout} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">আপনার নাম</label>
              <input type="text" required className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-black text-sm" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">মোবাইল নাম্বার</label>
              <input type="tel" required className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-black text-sm" placeholder="017xxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">পূর্ণাঙ্গ ঠিকানা</label>
              <textarea required rows={3} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-black text-sm resize-none" placeholder="Village, Post, Thana, District" value={address} onChange={(e) => setAddress(e.target.value)}></textarea>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">পেমেন্ট মেথড</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setPaymentMethod('cod')} className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${paymentMethod === 'cod' ? 'border-black bg-black text-white' : 'bg-gray-50 text-gray-700 hover:border-gray-300'}`}>
                  <span>💵 Cash On Delivery</span>
                </button>
                <button type="button" onClick={() => setPaymentMethod('bkash')} className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${paymentMethod === 'bkash' ? 'border-black bg-black text-white' : 'bg-gray-50 text-gray-700 hover:border-gray-300'}`}>
                  <span>📱 Mobile Banking</span>
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition shadow-lg disabled:bg-gray-300 mt-4 text-sm uppercase tracking-wider">
              {loading ? 'Processing Order...' : `Confirm Order (৳${finalTotal})`}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}