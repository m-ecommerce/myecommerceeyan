"use client";

import { createClient } from '@supabase/supabase-js';
import { useCartStore } from '../../../store/cartStore'; 
import { ShoppingCart, ArrowLeft, ShieldCheck, Truck, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
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
};

export default function ProductDetailsPage() {
  const { id } = useParams(); 
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]); 
  const [loading, setLoading] = useState(true);
  
  const [selectedSize, setSelectedSize] = useState('M'); 
  const availableSizes = ['M', 'L', 'XL', 'XXL'];

  const [activeImage, setActiveImage] = useState('');
  const [imagesList, setImagesList] = useState<string[]>([]);

  // 🔔 টোস্ট নোটিফিকেশন স্টেট
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 🔍 ইমেজ জুম পজিশন স্টেট (মাউসের কোঅর্ডিনেট ট্র্যাক করার জন্য)
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    async function fetchProductDetails() {
      try {
        setLoading(true);
        const { data: mainProduct, error: mainError } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (mainError) throw mainError;
        
        if (mainProduct) {
          setProduct(mainProduct);
          setActiveImage(mainProduct.image_url);
          
          const gallery = [
            mainProduct.image_url,
            'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=500',
            'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=500',
            'https://images.unsplash.com/photo-1562157873-818bc0726f68?q=80&w=500'
          ];
          setImagesList(gallery);

          let { data: relatedData, error: relatedError } = await supabase
            .from('products')
            .select('*')
            .eq('category', mainProduct.category)
            .neq('id', mainProduct.id)
            .limit(4);

          if (relatedError) throw relatedError;

          if (!relatedData || relatedData.length === 0) {
            const { data: fallbackData } = await supabase
              .from('products')
              .select('*')
              .neq('id', mainProduct.id)
              .limit(4);
            
            if (fallbackData) relatedData = fallbackData;
          }

          if (relatedData) setRelatedProducts(relatedData);
        }
      } catch (err) {
        console.error("Error fetching product data:", err);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchProductDetails();
  }, [id]);

  // 🖱️ মাউস নড়াচড়া করলে জুমের পজিশন ক্যালকুলেট করার ফাংশন
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    const productWithSize = {
      ...product,
      id: `${product.id}-${selectedSize}`, 
      product_id: product.id, 
      size: selectedSize
    };
    
    useCartStore.getState().addToCart(productWithSize);
    
    // ব্রাউজার অ্যালার্টের জায়গায় প্রিমিয়াম টোস্ট নোটিফিকেশন ট্রিগার
    setToastMessage(`"${product.name}" (${selectedSize} Size) কার্টে যোগ হয়েছে!`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xl font-medium">Loading product details...</div>;
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-xl text-gray-500">Product not found!</p>
        <Link href="/" className="bg-black text-white px-6 py-2 rounded-xl">Back to Home</Link>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;

  return (
    <div className="min-h-screen bg-white text-black">
      
      {/* 🔔 স্লাইড-ইন টোস্ট নোটিফিকেশন */}
      <div className={`fixed top-24 right-6 z-50 transform transition-all duration-500 ease-out flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border bg-white border-gray-100 text-black ${
        showToast ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-12 opacity-0 scale-90 pointer-events-none'
      }`}>
        <CheckCircle className="text-green-500 flex-shrink-0" size={22} />
        <span className="text-sm font-bold tracking-wide">{toastMessage}</span>
      </div>

      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <Link href="/" className="text-3xl font-bold text-black tracking-wider">EYAN</Link>
          <Link href="/cart" className="flex items-center gap-2 cursor-pointer hover:text-black transition font-semibold text-sm">
            <ShoppingCart size={22} />
            <span>Cart</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-black mb-8 transition font-medium w-fit">
          <ArrowLeft size={20} />
          Back to Collection
        </Link>

        {/* মেইন প্রোডাক্ট গ্রিড */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          
          {/* 🖼️ বাম পাশে ইমেজ গ্যালারি + ম্যাগনিফাইং জুম ইফেক্ট */}
          <div className="space-y-4">
            <div 
              className="bg-gray-50 rounded-3xl overflow-hidden shadow-inner border border-gray-100 relative cursor-zoom-in h-[450px]"
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
            >
              <img 
                src={activeImage} 
                alt={product.name} 
                className={`w-full h-full object-cover transition-transform duration-100 ease-out ${
                  isOutOfStock ? 'opacity-40' : ''
                }`}
                style={{
                  transform: isZoomed ? 'scale(2)' : 'scale(1)', // 👈 ২ গুণ জুম হবে
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`  // 👈 মাউস যেখানে থাকবে ঠিক সেখানে জুম হবে
                }}
              />
              {isOutOfStock && (
                <div className="absolute top-6 left-6 bg-red-500 text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl">
                  Out of Stock
                </div>
              )}
            </div>

            {/* থাম্বনেইল গ্যালারি */}
            <div className="grid grid-cols-4 gap-3">
              {imagesList.map((imgUrl, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(imgUrl)}
                  className={`h-24 bg-gray-50 rounded-2xl overflow-hidden border-2 transition-all ${
                    activeImage === imgUrl ? 'border-black scale-95 shadow-sm' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img src={imgUrl} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* ডান পাশে প্রোডাক্ট ইনফরমেশন */}
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-widest text-blue-600 font-semibold bg-blue-50 w-fit px-3 py-1 rounded-full">
              {product.category}
            </p>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-2xl font-extrabold text-black">৳{product.price}</p>
            
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Select Size</h3>
              <div className="flex gap-3">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-12 h-12 rounded-xl font-bold border transition text-xs ${
                      selectedSize === size ? 'border-black bg-black text-white shadow-md' : 'border-gray-200 text-gray-700 hover:border-black bg-white'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-b py-4 my-2 text-gray-700 leading-relaxed">
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Product Description</h3>
              <p className="text-xs whitespace-pre-line text-gray-600">{product.description}</p>
            </div>

            {/* 📦 লাইভ স্টক অ্যালার্ট */}
            <p className={`text-xs font-bold ${isOutOfStock ? 'text-red-500' : product.stock <= 3 ? 'text-amber-500 animate-pulse' : 'text-green-600'}`}>
              {isOutOfStock ? 'Out of Stock (Sold Out)' : product.stock <= 3 ? `⚠️ Only ${product.stock} items left in stock!` : `✓ In Stock (${product.stock} items available)`}
            </p>

            <button 
              onClick={handleAddToCart} 
              disabled={isOutOfStock} 
              className={`w-full md:w-auto px-10 py-4 rounded-2xl font-semibold transition shadow-lg text-sm uppercase tracking-wider ${
                isOutOfStock 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {isOutOfStock ? 'Out of Stock' : 'Add to Shopping Cart'}
            </button>

            {/* ট্রাস্ট ব্যাজ */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t text-center text-[10px] text-gray-600 font-medium">
              <div className="flex flex-col items-center gap-2 bg-gray-50 p-3 rounded-2xl">
                <Truck size={18} className="text-gray-700" />
                <span>Fast Delivery</span>
              </div>
              <div className="flex flex-col items-center gap-2 bg-gray-50 p-3 rounded-2xl">
                <ShieldCheck size={18} className="text-gray-700" />
                <span>100% Original</span>
              </div>
              <div className="flex flex-col items-center gap-2 bg-gray-50 p-3 rounded-2xl">
                <RefreshCw size={18} className="text-gray-700" />
                <span>7 Day Return</span>
              </div>
            </div>
          </div>
        </div>

        {/* 🌟 রিলেটেড প্রোডাক্টস সেকশন (You May Also Like) */}
        {relatedProducts.length > 0 && (
          <div className="mt-24 pt-12 border-t border-gray-100">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-8">You May Also Like</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relProduct) => (
                <Link 
                  href={`/product/${relProduct.id}`} 
                  key={relProduct.id} 
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition block"
                >
                  <div className="h-56 bg-gray-50 overflow-hidden">
                    <img 
                      src={relProduct.image_url} 
                      alt={relProduct.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-[9px] uppercase tracking-wider text-blue-600 font-bold mb-0.5">{relProduct.category}</p>
                    <h3 className="text-sm font-bold text-gray-800 line-clamp-1 group-hover:text-blue-600 transition">{relProduct.name}</h3>
                    <p className="text-sm font-black text-gray-900 mt-2">৳{relProduct.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}