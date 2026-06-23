"use client";

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { ShoppingBag, Users, DollarSign, Calendar, Eye, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';

const supabaseUrl = 'https://rbrqfecmdofvclvkhwuc.supabase.co';
const supabaseAnonKey = 'sb_publishable_WLNE9XA6NI5jarNBEJ_Phw_K195cum1';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null); // পপআপে ডিটেইলস দেখার জন্য

  // ডাটাবেজ থেকে অর্ডার ডাটা রিড করার ফাংশন
  async function fetchOrders() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false }); // নতুন অর্ডারগুলো উপরে দেখাবে

      if (error) throw error;
      if (data) setOrders(data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, []);

  // স্ট্যাটিস্টিক্স হিসাব করা
  const totalSales = orders.reduce((sum, order) => sum + (Number(order.total_price) || 0), 0);
  const totalOrders = orders.length;
  const uniqueCustomers = new Set(orders.map(order => order.phone)).size;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gray-50">
        <RefreshCw className="animate-spin text-gray-500" size={32} />
        <p className="text-gray-600 font-medium">Loading Orders Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* টপ হেডার সেকশন */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">EYAN Admin Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">রিয়েল-টাইম কাস্টমার অর্ডার এবং সেলস ট্র্যাকিং প্যানেল</p>
          </div>
          <button 
            onClick={fetchOrders}
            className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-xl border hover:bg-gray-50 transition text-sm font-semibold shadow-sm"
          >
            <RefreshCw size={16} /> Refresh Data
          </button>
        </div>

        {/* 📊 কাউন্টার কার্ডসমূহ (Stats Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Revenue</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">৳{totalSales}</h3>
            </div>
            <div className="bg-green-50 text-green-600 p-4 rounded-2xl">
              <DollarSign size={24} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Orders</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">{totalOrders}টি</h3>
            </div>
            <div className="bg-blue-50 text-blue-600 p-4 rounded-2xl">
              <ShoppingBag size={24} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Customers</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">{uniqueCustomers} জন</h3>
            </div>
            <div className="bg-purple-50 text-purple-600 p-4 rounded-2xl">
              <Users size={24} />
            </div>
          </div>
        </div>

        {/* 📋 অর্ডার ডাটা টেবিল সেকশন */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-bold text-gray-800">Recent Orders List</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 uppercase text-[11px] font-bold tracking-wider border-b">
                  <th className="py-4 px-6">Customer Info</th>
                  <th className="py-4 px-6">Date & Time</th>
                  <th className="py-4 px-6">Delivery Address</th>
                  <th className="py-4 px-6">Payment Method</th>
                  <th className="py-4 px-6">Total Amount</th>
                  <th className="py-4 px-6 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm text-gray-700">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-gray-900">{order.customer_name}</div>
                      <div className="text-xs text-gray-500 font-medium mt-0.5">{order.phone}</div>
                    </td>
                    <td className="py-4 px-6 text-gray-600 text-xs">
                      {new Date(order.created_at).toLocaleString('bn-BD')}
                    </td>
                    <td className="py-4 px-6 max-w-xs truncate text-gray-600">
                      {order.address}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                        order.payment_method === 'cod' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {order.payment_method === 'cod' ? '💵 COD' : '📱 MFS'}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-gray-900">
                      ৳{order.total_price}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex items-center gap-1 bg-black text-white px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-gray-800 transition shadow-sm"
                      >
                        <Eye size={14} /> View Items
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* 🔍 অর্ডার আইটেমস দেখার জন্য পপআপ মডাল (Modal Overlay) */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Order Items Details</h3>
                <p className="text-xs text-gray-500 mt-0.5">Customer: {selectedOrder.customer_name}</p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-black font-bold text-lg px-2"
              >
                ✕
              </button>
            </div>

            {/* কার্ট আইটেমের লিস্ট লুপ */}
            <div className="space-y-3">
              {Array.isArray(selectedOrder.items) ? (
                selectedOrder.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-4 items-center bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <img src={item.image_url} alt={item.name} className="w-14 h-14 object-cover rounded-xl" />
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-gray-800 line-clamp-1">{item.name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Price: ৳{item.price} | Qty: {item.quantity}
                      </p>
                      {item.size && (
                        <p className="text-[11px] font-bold text-blue-600 mt-1">
                          Size: <span className="bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{item.size}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">কোনো আইটেম ডাটা পাওয়া যায়নি।</p>
              )}
            </div>

            <div className="border-t pt-3 flex justify-between items-center text-sm font-bold text-gray-900">
              <span>Total Price Paid:</span>
              <span className="text-lg text-green-600">৳{selectedOrder.total_price}</span>
            </div>

            <button 
              onClick={() => setSelectedOrder(null)}
              className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition text-sm shadow-sm"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

    </div>
  );
}