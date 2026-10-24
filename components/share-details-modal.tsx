"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { MessageCircle, Send } from "@/components/ui/iconify-compat"
import { NIGERIAN_BANKS } from "@/lib/banks-data"
import { dataStore } from "@/lib/data-store"

interface ShareDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  recipientPhone?: string
}

export function ShareDetailsModal({ isOpen, onClose, recipientPhone }: ShareDetailsModalProps) {
  const [selectedBank, setSelectedBank] = useState<string>("Ecobank Nigeria")
  const [recipientPhoneInput, setRecipientPhoneInput] = useState<string>(recipientPhone || "")
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const userData = dataStore.getUserData()
  console.log('ShareDetailsModal userData:', userData)
  console.log('ShareDetailsModal selectedBank:', selectedBank)

  const cardPreviewData = {
    bank: selectedBank,
    email: userData?.email || "",
    phone: userData?.phone || "",
  }
  console.log('ShareDetailsModal cardPreviewData:', cardPreviewData)

  const buildVCard = () =>
    [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${userData?.name || "Ecobank Customer"}`,
      `ORG:${selectedBank}`,
      userData?.email ? `EMAIL:${userData.email}` : "",
      userData?.phone ? `TEL:${userData.phone}` : "",
      "NOTE:Business card shared via Ecobank Mobile App",
      "END:VCARD",
    ]
      .filter(Boolean)
      .join("\n")

  const handleShareBusinessCard = async () => {
    if (!recipientPhoneInput.trim()) {
      setError("Please enter a recipient phone number")
      return
    }

    setIsSending(true)
    setError(null)

    try {
      const vCard = buildVCard()

      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({
          title: `${selectedBank} Business Card`,
          text: vCard,
        })
      } else if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(vCard)
      } else {
        throw new Error("Sharing is not supported on this device")
      }

      setSuccess(true)
      dataStore.addNotification({
        title: "Business Card Shared",
        message: `Business card ready to share with ${recipientPhoneInput}`,
        type: "success",
      })
      setTimeout(() => {
        onClose()
        setSuccess(false)
        setRecipientPhoneInput("")
      }, 2000)
    } catch (err) {
      // A user-cancelled share sheet is not an error
      if ((err as Error)?.name === "AbortError") return
      setError(err instanceof Error ? err.message : "Failed to share business card")
    } finally {
      setIsSending(false)
    }
  }

  const handleShare = (platform: string) => {
    const shareText = `Bank: ${selectedBank}\nEmail: ${userData?.email || ""}\nPhone: ${userData?.phone || ""}`
    const encodedText = encodeURIComponent(shareText)

    switch (platform) {
      case "whatsapp":
        window.open(`https://wa.me/?text=${encodedText}`, "_blank")
        break
      case "telegram":
        window.open(`https://t.me/share/url?text=${encodedText}`, "_blank")
        break
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto bg-white dark:bg-gray-900">
        <DialogHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 -m-6 mb-4 p-6 rounded-t-2xl border-b border-gray-200/50 dark:border-gray-700/50">
          <DialogTitle className="text-center text-base font-semibold">Send Business Card</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Bank Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Select Bank:</label>
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {NIGERIAN_BANKS.map((bank) => (
                <option key={bank.code} value={bank.name}>
                  {bank.name}
                </option>
              ))}
            </select>
          </div>

          {/* Recipient Phone Number */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Recipient Phone:</label>
            <input
              type="tel"
              value={recipientPhoneInput}
              onChange={(e) => setRecipientPhoneInput(e.target.value)}
              placeholder="+234 801 234 5678 or 0801234567"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Business Card Preview */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200">
            <CardContent className="p-4">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-[#004A9F] rounded-full flex items-center justify-center mx-auto">
                  <span className="text-white text-2xl font-bold">📇</span>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-lg text-gray-800">{cardPreviewData.bank}</div>
                  <div className="text-sm text-gray-600">
                    <div>📧 {cardPreviewData.email}</div>
                    <div>📱 {cardPreviewData.phone}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">{error}</div>}

          {/* Success Message */}
          {success && (
            <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
              Business card shared successfully!
            </div>
          )}

          {/* Share Options */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700 text-center">Choose sharing method:</div>

            <Button
              onClick={() => handleShare("whatsapp")}
              className="w-full bg-green-500 hover:bg-green-600 text-white flex items-center gap-3"
              disabled={isSending}
            >
              <MessageCircle className="h-5 w-5" />
              Share via WhatsApp
            </Button>

            <Button
              onClick={handleShareBusinessCard}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-3 disabled:opacity-50"
              disabled={isSending || !recipientPhoneInput.trim()}
            >
              <Send className="h-5 w-5" />
              {isSending ? "Sharing..." : "Share Business Card"}
            </Button>

            <Button
              onClick={() => handleShare("telegram")}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white flex items-center gap-3"
              disabled={isSending}
            >
              <Send className="h-5 w-5" />
              Share via Telegram
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
