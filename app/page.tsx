"use client";

import { createClient } from '@supabase/supabase-js';
import { useCartStore } from '../store/cartStore'; 
import { ShoppingCart, Search, Sun, Moon, CheckCircle, AlertTriangle, X, Trash2, ShoppingBag, Menu, Flame, Clock } from 'lucide-react'; // 👈 নতুন আইকন যোগ করা হয়েছে
import Link from 'next/link';
import { useEffect, useState } from 'react';

const supabaseUrl = 'https://rbrqfecmdofvclvkhwuc.supabase.co';
const supabaseAnonKey = 'sb_publishable_WLNE9XA6NI5jarNBEJ_Phw_K195cum1';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock: number;
  max_stock?: number; // 👈 প্রোগ্রেস বারের জন্য ব্যাকআপ স্টক
};

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [categories, setCategories] = useState<string[]>(['ALL']);
  const [darkMode, setDarkMode] = useState(false);

  // 🔔 টোস্ট নোটিফিকেশন স্টেট
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'warning'>('success');

  // 🛒 সাইড ড্রয়ার স্টেটসমূহ
  const [isCartOpen, setIsCartOpen] = useState(false); 
  const [isMenuOpen, setIsMenuOpen] = useState(false); 

  // ⏱️ ফ্ল্যাশ সেল টাইমার স্টেট (৩ ঘণ্টা থেকে কমতে থাকবে)
  const [timeLeft, setTimeLeft] = useState(3 * 60 * 60); 

  // 🛒 লাইভ পারচেজ পপ-আপ স্টেট
  const [liveOrder, setLiveOrder] = useState<{ name: string; city: string; product: string } | null>(null);
  const [showLiveOrder, setShowLiveOrder] = useState(false);

  // Zustand স্টোর
  const { items, increaseQuantity, decreaseQuantity, removeFromCart, clearCart, totalPrice } = useCartStore() as any;
  const totalItems = useCartStore((state: any) => typeof state.totalItems === 'function' ? state.totalItems() : 0);

  // ফ্ল্যাশ সেল টাইমার কাউন্টডাউন ইফেক্ট
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 3 * 60 * 60)); // সময় শেষ হলে আবার রিস্টার্ট হবে
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // লাইভ পারচেজ পপ-আপ নোটিফিকেশন ইফেক্ট (প্রতি ১২ সেকেন্ড পর পর নতুন পপ-আপ আসবে)
  useEffect(() => {
    const names = ["আরিফ", "তানভীর", "সাজিদ", "রাশেদ", "ফাহিম", "ইমরান", "রাফি", "নাহিদ"];
    const cities = ["ঢাকা", "চট্টগ্রাম", "সিলেট", "খুলনা", "রাজশাহী", "রংপুর", "বরিশাল", "গাজীপুর"];
    const fakeProducts = ["পোলো শার্ট", "প্রিমিয়াম জিন্স", "ব্লাক হুডি", "ক্যাজুয়াল শার্ট", "চিনো প্যান্ট"];

    const triggerLiveNotification = () => {
      const randomName = names[Math.floor(Math.random() * names.length)];
      const randomCity = cities[Math.floor(Math.random() * cities.length)];
      const randomProduct = fakeProducts[Math.floor(Math.random() * fakeProducts.length)];

      setLiveOrder({ name: randomName, city: randomCity, product: randomProduct });
      setShowLiveOrder(true);

      // ৫ সেকেন্ড পর নোটিফিকেশনটি নেমে যাবে
      setTimeout(() => setShowLiveOrder(false), 5000);
    };

    // সাইটে ঢোকার ৪ সেকেন্ড পর প্রথমটা আসবে, তারপর প্রতি ১২ সেকেন্ড পর পর আসবে
    const initialTimeout = setTimeout(triggerLiveNotification, 4000);
    const interval = setInterval(triggerLiveNotification, 12000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase.from('products').select('*');
        if (error) throw error;
        if (data) {
          // প্রোগ্রেস বারের জন্য একটি ফেক ম্যাক্সিমাম স্টক (যেমন: স্টক + ১০) সেট করে রাখছি
          const enrichedProducts = data.map((p: Product) => ({
            ...p,
            max_stock: p.stock > 0 ? p.stock + Math.floor(Math.random() * 8) + 3 : 10
          }));
          setProducts(enrichedProducts);
          setFilteredProducts(enrichedProducts);

          const uniqueCategories = ['ALL', ...Array.from(new Set(data.map((p: Product) => p.category.toUpperCase())))];
          setCategories(uniqueCategories);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // সার্চ এবং ফিল্টারিং
  useEffect(() => {
    let result = products;
    if (selectedCategory !== 'ALL') {
      result = result.filter(p => p.category.toUpperCase() === selectedCategory);
    }
    if (searchQuery.trim() !== '') {
      result = result.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    setFilteredProducts(result);
  }, [searchQuery, selectedCategory, products]);

  // ফরম্যাটেড টাইম (hh:mm:ss) বানানোর ফাংশন
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const triggerToast = (message: string, type: 'success' | 'warning' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleIncrease = (item: any) => {
    if (item.quantity >= item.stock) {
      triggerToast(`দুঃখিত, এই প্রোডাক্টটি স্টকে আর মাত্র ${item.stock}টিই আছে!`, 'warning');
      return;
    }
    increaseQuantity(item.id);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* 🔥 ১. টপ ফ্ল্যাশ সেল কাউন্টডাউন ব্যানার */}
      <div className="bg-gradient-to-r from-amber-600 via-red-600 to-pink-600 text-white py-2.5 px-4 text-center flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 shadow-md z-50 relative">
        <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest animate-pulse">
          <Flame size={16} fill="white" /> Flash Sale is Live!
        </div>
        <div className="text-xs sm:text-sm font-bold flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-full border border-white/10">
          <Clock size={14} /> অফার শেষ হতে বাকি: <span className="font-mono text-yellow-300 font-black text-sm tracking-wider">{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* 🔔 সাকসেস/ওয়ার্নিং টোস্ট নোটিফিকেশন */}
      <div className={`fixed top-24 right-6 z-50 transform transition-all duration-500 ease-out flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border ${
        showToast ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-12 opacity-0 scale-90 pointer-events-none'
      } ${darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-100 text-black'}`}>
        {toastType === 'success' ? <CheckCircle className="text-green-500 flex-shrink-0" size={22} /> : <AlertTriangle className="text-amber-500 flex-shrink-0" size={22} />}
        <span className="text-sm font-bold tracking-wide">{toastMessage}</span>
      </div>

      {/* 🛒 ২. লাইভ পারচেজ পপ-আপ নোটিফিকেশন (বাম কোণায়) */}
      <div className={`fixed bottom-6 left-6 z-50 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-100 p-4 rounded-2xl shadow-2xl max-w-xs flex items-center gap-3 transform transition-all duration-500 ease-out ${
        showLiveOrder ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-90 pointer-events-none'
      }`}>
        <div className="w-10 h-10 bg-green-500/10 dark:bg-green-500/20 rounded-full flex items-center justify-center text-green-500 flex-shrink-0">
          <ShoppingBag size={20} />
        </div>
        <div className="text-xs leading-relaxed">
          <p className="font-medium text-gray-500 dark:text-gray-400">রিয়েল-টাইম অর্ডার অ্যালার্ট</p>
          <p className="text-gray-900 dark:text-white font-bold mt-0.5">
            {liveOrder?.city} থেকে <span className="text-blue-600 dark:text-blue-400">{liveOrder?.name}</span> এইমাত্র একটি <span className="underline">{liveOrder?.product}</span> অর্ডার করেছেন!
          </p>
        </div>
      </div>

      {/* 👑 Header / Navbar */}
      <header className={`border-b sticky top-0 z-40 transition-colors duration-300 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMenuOpen(true)} className={`p-2 rounded-xl border transition-colors ${darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-white' : 'bg-gray-100 border-gray-200 hover:bg-gray-200 text-black'}`}>
              <Menu size={22} />
            </button>
            <Link href="/" className={`text-3xl font-black tracking-wider transition-colors ${darkMode ? 'text-white' : 'text-black'}`}>EYAN</Link>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => setDarkMode(!darkMode)} className={`p-2.5 rounded-2xl border transition-all duration-300 ${darkMode ? 'bg-gray-800 border-gray-700 text-yellow-400 hover:bg-gray-700' : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'}`}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => setIsCartOpen(true)} className={`flex items-center gap-2 cursor-pointer transition-colors text-sm font-bold bg-transparent border-none ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-black'}`}>
              <div className="relative">
                <ShoppingCart size={20} />
                {totalItems > 0 && <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-black animate-pulse">{totalItems}</span>}
              </div>
              <span>Cart</span>
            </button>
          </div>
        </div>
      </header>

      {/* 🔍 সার্চ বার */}
      <div className="max-w-7xl mx-auto px-6 pt-10">
        <div className={`flex justify-center items-center p-6 rounded-3xl shadow-sm border transition-colors duration-300 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
            <input type="text" placeholder="আপনার পছন্দের প্রোডাক্টটি খুঁজুন..." className={`w-full pl-12 pr-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-black text-sm transition-colors duration-300 ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-100 text-black'}`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>
      </div>

      {/* 🛍️ Product Grid */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        <h2 className="text-xl font-extrabold mb-6 tracking-wide uppercase">Category: <span className="text-blue-600 dark:text-blue-400">{selectedCategory}</span></h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map((product: Product) => {
            const isOutOfStock = product.stock <= 0;
            
            // 📊 ৩. স্টক প্রোগ্রেস বার পার্সেন্টেজ ক্যালকুলেশন
            const maxStk = product.max_stock || 15;
            const soldPercent = Math.min(95, Math.max(40, ((maxStk - product.stock) / maxStk) * 100));

            return (
              <div key={product.id} className={`rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                <Link href={`/product/${product.id}`} className="cursor-pointer block group relative">
                  {isOutOfStock && <div className="absolute top-4 left-4 z-10 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-sm">Out of Stock</div>}
                  
                  <div className={`overflow-hidden h-72 bg-gray-100 ${isOutOfStock ? 'opacity-50' : ''}`}>
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  </div>
                  
                  <div className="p-6 pb-2">
                    <p className="text-[10px] uppercase tracking-widest text-blue-500 font-bold mb-1">{product.category}</p>
                    <h3 className={`text-base font-bold mb-2 transition-colors line-clamp-1 ${darkMode ? 'text-white group-hover:text-blue-400' : 'text-gray-800 group-hover:text-blue-600'}`}>{product.name}</h3>
                    <p className={`text-xs line-clamp-2 leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{product.description}</p>
                    
                    {/* 📦 লাইভ স্টক টেক্সট */}
                    <p className={`text-[11px] font-bold mt-2 ${isOutOfStock ? 'text-red-500' : product.stock <= 3 ? 'text-amber-500 animate-pulse' : 'text-green-500'}`}>
                      {isOutOfStock ? 'Sold Out' : product.stock <= 3 ? `Only ${product.stock} items left!` : `In Stock: ${product.stock}`}
                    </p>

                    {/* 📊 অ্যানিমেটেড স্টক প্রোগ্রেস বার (স্টক আউট না থাকলে দেখাবে) */}
                    {!isOutOfStock && (
                      <div className="mt-3 space-y-1">
                        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${product.stock <= 3 ? 'bg-gradient-to-r from-amber-500 to-red-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
                            style={{ width: `${soldPercent}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] font-bold tracking-wide text-gray-400 uppercase">
                          <span>{Math.floor(soldPercent)}% Sold Out</span>
                          <span>{product.stock} Left</span>
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
                
                <div className="p-6 pt-0">
                  <div className="flex justify-between items-center mt-4">
                    <span className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>৳{product.price}</span>
                    <button disabled={isOutOfStock} onClick={() => { useCartStore.getState().addToCart({ ...product, size: 'M' }); triggerToast(`"${product.name}" সফলভাবে কার্টে যোগ হয়েছে!`, 'success'); setIsCartOpen(true); }} className={`px-4 py-2.5 rounded-xl transition-all font-bold text-xs shadow-sm ${isOutOfStock ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-none' : darkMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'}`}>
                      {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ☰ বাম পাশের স্লাইডিং ক্যাটাগরি মেনু */}
      <div onClick={() => setIsMenuOpen(false)} className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} />
      <div className={`fixed top-0 left-0 h-full w-[300px] shadow-2xl z-50 transform transition-transform duration-500 ease-in-out flex flex-col border-r ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} ${darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-100 text-black'}`}>
        <div className="p-6 flex justify-between items-center border-b border-gray-100 dark:border-gray-800"><h2 className="text-lg font-black tracking-wide uppercase">Categories</h2><button onClick={() => setIsMenuOpen(false)} className={`p-1.5 rounded-xl border transition-colors ${darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}><X size={18} /></button></div>
        <div className="flex-1 overflow-y-auto p-6 space-y-2">
          {categories.map((category) => (
            <button key={category} onClick={() => { setSelectedCategory(category); setIsMenuOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 border ${selectedCategory === category ? (darkMode ? 'bg-white text-black border-white shadow-md' : 'bg-black border-black text-white shadow-md') : (darkMode ? 'bg-gray-800/40 border-transparent text-gray-400 hover:text-white hover:bg-gray-800' : 'bg-gray-50 border-transparent text-gray-600 hover:border-black hover:bg-gray-100')}`}>{category === 'ALL' ? '🛒 ALL PRODUCTS' : `📁 ${category}`}</button>
          ))}
        </div>
      </div>

      {/* 🛒 ডান পাশের স্লাইডিং কার্ট ড্রয়ার প্যানেল */}
      <div onClick={() => setIsCartOpen(false)} className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-300 ${isCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} />
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[420px] shadow-2xl z-50 transform transition-transform duration-500 ease-in-out flex flex-col justify-between border-l ${isCartOpen ? 'translate-x-0' : 'translate-x-full'} ${darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-100 text-black'}`}>
        <div className="p-6 flex justify-between items-center border-b border-gray-100 dark:border-gray-800"><div className="flex items-center gap-2"><ShoppingBag size={20} className="text-blue-500" /><h2 className="text-lg font-black tracking-wide">Your Cart ({totalItems})</h2></div><button onClick={() => setIsCartOpen(false)} className={`p-1.5 rounded-xl border transition-colors ${darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}><X size={18} /></button></div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-none">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-3 opacity-60"><ShoppingCart size={48} className="text-gray-400 stroke-1" /><p className="text-sm font-medium">আপনার কার্টটি একদম খালি!</p></div>
          ) : (
            items.map((item: any) => (
              <div key={item.id} className={`flex gap-4 items-center p-3 rounded-2xl border transition-colors ${darkMode ? 'bg-gray-800/50 border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
                <img src={item.image_url} alt={item.name} className="w-14 h-14 object-cover rounded-xl flex-shrink-0" />
                <div className="flex-1 min-w-0"><h4 className="font-bold text-xs truncate">{item.name}</h4><p className="text-[10px] text-blue-500 font-bold mt-0.5">Size: {item.size || 'M'}</p><p className="text-xs font-black mt-1">৳{item.price * item.quantity}</p></div>
                <div className="flex flex-col items-end gap-2">
                  <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                  <div className={`flex items-center gap-2 px-2 py-0.5 rounded-lg border text-xs font-bold ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white'}`}>
                    <button onClick={() => decreaseQuantity(item.id)} className="text-gray-400 hover:text-black dark:hover:text-white">-</button>
                    <span className="w-3 text-center text-[11px]">{item.quantity}</span>
                    <button onClick={() => handleIncrease(item)} className="text-gray-400 hover:text-black dark:hover:text-white">+</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {items.length > 0 && (
          <div className={`p-6 border-t ${darkMode ? 'border-gray-800 bg-gray-900/80' : 'border-gray-100 bg-gray-50/80'}`}>
            <div className="flex justify-between items-center mb-4"><span className="text-sm font-medium opacity-70">Subtotal Amount:</span><span className="text-xl font-black text-blue-600 dark:text-blue-400 transition-all duration-300 transform scale-105">৳{totalPrice()}</span></div>
            <div className="flex gap-3">
              <button onClick={() => clearCart()} className={`px-4 py-3 rounded-xl text-xs font-bold border transition-colors ${darkMode ? 'border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white' : 'border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-black'}`}>Clear</button>
              <Link href="/cart" className="flex-1 bg-blue-600 text-white font-bold text-xs py-3 rounded-xl hover:bg-blue-700 transition shadow-md shadow-blue-500/20 text-center flex items-center justify-center gap-1">Go to Checkout ➔</Link>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}