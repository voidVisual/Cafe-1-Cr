"use client";

import { Save } from "lucide-react";

export default function Settings() {
  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <button className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors shadow-sm">
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-200 divide-y divide-gray-200">
        {/* Profile Section */}
        <div className="p-6 md:p-8">
          <h2 className="text-lg font-medium leading-6 text-gray-900">Profile Settings</h2>
          <p className="mt-1 text-sm text-gray-500">Update your account information and preferences.</p>

          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="first-name" className="block text-sm font-medium leading-6 text-gray-900">First name</label>
              <div className="mt-2">
                <input type="text" name="first-name" id="first-name" defaultValue="Admin" className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6 px-3" />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="last-name" className="block text-sm font-medium leading-6 text-gray-900">Last name</label>
              <div className="mt-2">
                <input type="text" name="last-name" id="last-name" defaultValue="User" className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6 px-3" />
              </div>
            </div>

            <div className="sm:col-span-4">
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">Email address</label>
              <div className="mt-2">
                <input id="email" name="email" type="email" defaultValue="admin@cafe.com" className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6 px-3" />
              </div>
            </div>
          </div>
        </div>

        {/* Store Settings Section */}
        <div className="p-6 md:p-8">
          <h2 className="text-lg font-medium leading-6 text-gray-900">Store Configuration</h2>
          <p className="mt-1 text-sm text-gray-500">Manage how your cafe appears to customers.</p>

          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <label htmlFor="store-name" className="block text-sm font-medium leading-6 text-gray-900">Store Name</label>
              <div className="mt-2">
                <input type="text" name="store-name" id="store-name" defaultValue="Central Cafe" className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6 px-3" />
              </div>
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="store-description" className="block text-sm font-medium leading-6 text-gray-900">Store Description</label>
              <div className="mt-2">
                <textarea id="store-description" name="store-description" rows={3} defaultValue="The best coffee in town. Open 24/7." className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6 px-3" />
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="p-6 md:p-8">
          <h2 className="text-lg font-medium leading-6 text-gray-900">Notifications</h2>
          <p className="mt-1 text-sm text-gray-500">Choose what updates you want to receive.</p>

          <div className="mt-6 space-y-6">
            <div className="flex items-start">
              <div className="flex h-6 items-center">
                <input id="new-orders" name="new-orders" type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-600" />
              </div>
              <div className="ml-3 text-sm leading-6">
                <label htmlFor="new-orders" className="font-medium text-gray-900">New Orders (Desktop Notification)</label>
                <p className="text-gray-500">Get notified immediately when a new order is placed.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex h-6 items-center">
                <input id="daily-summary" name="daily-summary" type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-600" />
              </div>
              <div className="ml-3 text-sm leading-6">
                <label htmlFor="daily-summary" className="font-medium text-gray-900">Daily Summary (Email)</label>
                <p className="text-gray-500">Receive a daily email with summary of revenue and orders.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
