"use client";

import { MessageCircle, Clock } from "lucide-react";

export default function MessagesPage() {
  return (
    <div className="max-w-[800px] mx-auto">
      <div className="flex items-center gap-2.5 mb-8">
        <MessageCircle size={22} className="text-sage" />
        <h1 className="text-2xl font-bold text-ink tracking-tight">Messages</h1>
      </div>

      <div className="rounded-2xl border border-border bg-card p-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-sage/8 flex items-center justify-center mx-auto mb-6">
          <Clock size={28} className="text-sage" />
        </div>
        <h2 className="text-xl font-bold text-ink mb-2">Coming Soon</h2>
        <p className="text-[15px] text-ink-secondary max-w-[400px] mx-auto leading-relaxed">
          Secure therapist-client messaging with end-to-end encryption is coming soon. Use broadcast for now.
        </p>
      </div>
    </div>
  );
}
