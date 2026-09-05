"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  ChevronDown,
  CircleX,
  Clock3,
  FileText,
  MessageCircle,
  MoreVertical,
  Paperclip,
  Phone,
  RefreshCw,
  Search,
  Send,
  Settings,
  Smile,
  SquarePen,
  Users,
  Video,
  Wifi,
  X,
} from "lucide-react";
import { WhatsAppAccountPanel } from "./WhatsAppAccountPanel";
import {
  type WhatsAppConversation,
  type WhatsAppMessage,
  useWhatsAppAccount,
} from "@/hooks/useWhatsAppAccount";
import { playById } from "@/lib/sound";

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "W"
  );
}

function avatarColor(value: string) {
  const colors = [
    "#2f9e78",
    "#d76c6c",
    "#4f87d6",
    "#8d68c6",
    "#c48243",
    "#328f9b",
    "#c45f91",
  ];
  return colors[
    Array.from(value).reduce(
      (total, character) => total + character.charCodeAt(0),
      0,
    ) % colors.length
  ];
}

function formatTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString())
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const difference = Math.floor(
    (today.getTime() - date.getTime()) / 86_400_000,
  );
  if (difference < 7) return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { day: "2-digit", month: "short" });
}

function mediaSource(message: WhatsAppMessage) {
  if (message.media?.url) return message.media.url;
  if (!message.media?.data) return null;
  return message.media.data.startsWith("data:")
    ? message.media.data
    : `data:${message.media.mimeType || "application/octet-stream"};base64,${message.media.data}`;
}

function Media({ message }: { message: WhatsAppMessage }) {
  const source = mediaSource(message);
  if (!message.media) return null;
  const mediaType = message.media.type.toLowerCase();
  if (!source)
    return (
      <div className="mb-1.5 flex items-center gap-2 rounded-lg bg-black/5 px-2 py-2 text-[11px] dark:bg-white/10">
        <FileText size={16} />
        {message.media.fileName || message.media.type}
      </div>
    );
  if (message.media.mimeType?.startsWith("image/") || mediaType === "image")
    return (
      <img
        src={source}
        alt={message.media.fileName || "Shared image"}
        className="mb-1.5 max-h-64 w-full rounded-lg object-contain"
      />
    );
  if (message.media.mimeType?.startsWith("video/") || mediaType === "video")
    return (
      <video
        src={source}
        controls
        className="mb-1.5 max-h-64 w-full rounded-lg"
      />
    );
  if (message.media.mimeType?.startsWith("audio/") || mediaType === "audio")
    return <audio src={source} controls className="mb-1.5 max-w-full" />;
  return (
    <a
      href={source}
      download={message.media.fileName}
      className="mb-1.5 flex items-center gap-2 rounded-lg bg-black/5 px-2 py-2 text-[11px] underline dark:bg-white/10"
    >
      <FileText size={16} />
      {message.media.fileName || "Download attachment"}
    </a>
  );
}

function MessageStatus({ status }: { status: WhatsAppMessage["status"] }) {
  if (status === "failed") return <CircleX size={13} aria-label="Failed" />;
  if (status === "read")
    return <CheckCheck size={13} className="text-cyan-200" aria-label="Read" />;
  if (status === "received")
    return <CheckCheck size={13} aria-label="Delivered" />;
  if (status === "sent") return <Check size={13} aria-label="Sent" />;
  return <Clock3 size={12} aria-label="Pending" />;
}

function MessageText({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s<>"']+)/gi);
  return (
    <p className="min-w-0 whitespace-pre-wrap break-words text-[13px] leading-[1.38]">
      {parts.map((part, index) => {
        if (!/^https?:\/\//i.test(part)) return part;
        const suffix = part.match(/[.,!?;:]+$/)?.[0] || "";
        const candidate = suffix ? part.slice(0, -suffix.length) : part;
        try {
          const url = new URL(candidate);
          if (url.protocol !== "http:" && url.protocol !== "https:")
            return part;
          return (
            <React.Fragment key={`${candidate}-${index}`}>
              <a
                href={url.href}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all font-medium underline decoration-current/60 underline-offset-2 hover:decoration-current"
              >
                {candidate}
              </a>
              {suffix}
            </React.Fragment>
          );
        } catch {
          return part;
        }
      })}
    </p>
  );
}

export default function WhatsAppApp() {
  const whatsapp = useWhatsAppAccount();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAccount, setShowAccount] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [startingCall, setStartingCall] = useState<"audio" | "video" | null>(
    null,
  );
  const [pendingCall, setPendingCall] = useState<{
    type: "audio" | "video";
    link: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filtered = whatsapp.conversations.filter((conversation) =>
    conversation.title.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );
  const selected = whatsapp.conversations.find(
    (conversation) => conversation.chatId === selectedChatId,
  );
  const incomingCall =
    whatsapp.account.activeCall?.status === "ringing"
      ? whatsapp.account.activeCall
      : null;
  const incomingCaller = incomingCall
    ? whatsapp.conversations.find(
        (conversation) => conversation.chatId === incomingCall.from,
      )?.title || incomingCall.from
    : "";

useEffect(() => {
  if (incomingCall) {
    void playById("yo-phone-is-ringing").catch(() => {});
  }
}, [incomingCall]);


  const openIncomingCall = () => {
    window.open("https://web.whatsapp.com/", "whatsapp-web");
  };

  useEffect(() => {
    if (
      window.matchMedia("(min-width: 640px)").matches &&
      !selectedChatId &&
      whatsapp.conversations[0]
    ) {
      setSelectedChatId(whatsapp.conversations[0].chatId);
    }
  }, [selectedChatId, whatsapp.conversations]);

  useEffect(() => {
    if (!selectedChatId) return;
    let active = true;
    setLoadingMessages(true);
    setError(null);
    void whatsapp
      .loadMessages(selectedChatId)
      .then((result) => {
        if (active) setMessages(result.messages);
      })
      .catch((loadError) => {
        if (active)
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Messages could not be loaded",
          );
      })
      .finally(() => {
        if (active) setLoadingMessages(false);
      });
    return () => {
      active = false;
    };
  }, [selectedChatId, whatsapp.account.lastSyncAt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const reloadConversation = async () => {
    if (!selectedChatId) return;
    const result = await whatsapp.loadMessages(selectedChatId);
    setMessages(result.messages);
    await whatsapp.refresh();
  };

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = inputValue.trim();
    if (!text || !selected || sending) return;
    setSending(true);
    setError(null);
    setInputValue("");
    try {
      await whatsapp.sendMessage(selected.chatId, text);
      await reloadConversation();
    } catch (sendError) {
      setInputValue(text);
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Message could not be sent",
      );
    } finally {
      setSending(false);
    }
  };

  const sendFile = async (file: File) => {
    if (!selected || file.size > 8 * 1024 * 1024) {
      setError(
        file.size > 8 * 1024 * 1024
          ? "Attachments must be 8 MB or smaller"
          : "Select a conversation first",
      );
      return;
    }
    setSending(true);
    setError(null);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () =>
          reject(new Error("Attachment could not be read"));
        reader.readAsDataURL(file);
      });
      await whatsapp.sendMedia(selected.chatId, {
        base64: dataUrl.split(",", 2)[1],
        mimeType: file.type || "application/octet-stream",
        fileName: file.name,
      });
      await reloadConversation();
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Attachment could not be sent",
      );
    } finally {
      setSending(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const startCall = async (type: "audio" | "video") => {
    if (!selected || startingCall) return;
    const callWindow = window.open("about:blank", "whatsapp-web-call");
    setStartingCall(type);
    setError(null);
    try {
      if (selected.kind !== "user")
        throw new Error(
          "Direct calling is available for individual WhatsApp contacts only",
        );
      if ("Notification" in window && Notification.permission === "default") {
        void Notification.requestPermission();
      }
      const call = await whatsapp.startCall(selected.chatId, type);
      setPendingCall({ type, link: call.link });
      if (callWindow) {
        callWindow.opener = null;
        callWindow.location.replace(call.link);
      } else {
        window.open(call.link, "_blank", "noopener,noreferrer");
      }
      await reloadConversation().catch(() => undefined);
    } catch (callError) {
      callWindow?.close();
      setError(
        callError instanceof Error
          ? callError.message
          : "WhatsApp call could not be started",
      );
    } finally {
      setStartingCall(null);
    }
  };

  const joinCall = () => {
    if (!pendingCall) return;
    window.open(pendingCall.link, "whatsapp-web-call");
  };

  const showMobileSidebar = !selected;

  return (
    <div
      className="relative flex h-full min-h-[500px] w-full select-none overflow-hidden rounded-lg border border-white/50 bg-white/80 text-[13px] text-[#202124] shadow-[0_24px_70px_rgba(15,23,42,0.18)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#111820]/88 dark:text-white"
      style={
        {
          "--whatsapp-accent": "var(--theme-primary-color, #1fa877)",
          "--whatsapp-soft":
            "var(--theme-primary-soft, rgba(31, 168, 119, 0.14))",
        } as React.CSSProperties
      }
    >
      {incomingCall && (
        <div
          role="alert"
          className="absolute inset-x-3 top-3 z-40 mx-auto flex max-w-md items-center gap-3 rounded-lg border border-white/60 bg-[#17201e] p-3 text-white shadow-2xl"
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--whatsapp-accent)]">
            {incomingCall.type === "video" ? (
              <Video size={18} />
            ) : (
              <Phone size={18} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">
              Incoming {incomingCall.type} call
            </p>
            <p className="truncate text-[10px] text-white/65">
              {incomingCaller}
            </p>
          </div>
          <button
            type="button"
            onClick={openIncomingCall}
            className="h-8 rounded-md bg-[var(--whatsapp-accent)] px-3 text-[10px] font-semibold"
          >
            Answer in WhatsApp
          </button>
          <button
            type="button"
            onClick={() =>
              void whatsapp
                .rejectCall(incomingCall.callId)
                .catch((callError) =>
                  setError(
                    callError instanceof Error
                      ? callError.message
                      : "Call could not be rejected",
                  ),
                )
            }
            className="h-8 rounded-md bg-red-600 px-3 text-[10px] font-semibold"
          >
            Reject
          </button>
        </div>
      )}
      {pendingCall && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="whatsapp-call-title"
          className="absolute inset-0 z-50 grid place-items-center bg-black/45 p-5 backdrop-blur-sm"
        >
          <div className="w-full max-w-sm rounded-lg border border-white/60 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#17201e]">
            <div className="flex items-start justify-between gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--whatsapp-accent)] text-white">
                {pendingCall.type === "video" ? (
                  <Video size={20} />
                ) : (
                  <Phone size={20} />
                )}
              </div>
              <button
                type="button"
                onClick={() => setPendingCall(null)}
                className="grid h-8 w-8 place-items-center rounded-full text-[#707b85] hover:bg-black/5 dark:hover:bg-white/10"
                aria-label="Close call dialog"
              >
                <X size={17} />
              </button>
            </div>
            <h2
              id="whatsapp-call-title"
              className="mt-4 text-base font-semibold"
            >
              WhatsApp Web call opened
            </h2>
            <p className="mt-1.5 text-xs leading-5 text-[#707b85] dark:text-white/60">
              The call link was shared with this contact. Allow WhatsApp
              Web&apos;s microphone, camera, and notification permissions when
              prompted. WhatsApp requires a final Join action.
            </p>
            <button
              type="button"
              onClick={joinCall}
              className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[var(--whatsapp-accent)] px-4 font-semibold text-white shadow-md"
            >
              {pendingCall.type === "video" ? (
                <Video size={16} />
              ) : (
                <Phone size={16} />
              )}
              Open WhatsApp Web call
            </button>
          </div>
        </div>
      )}
      <aside
        className={`${showMobileSidebar ? "flex" : "hidden"} relative w-full shrink-0 flex-col overflow-hidden border-r border-white/70 bg-white/55 backdrop-blur-2xl dark:border-white/10 dark:bg-[#17201e]/90 sm:flex sm:w-[326px]`}
      >
        <div className="flex h-12 shrink-0 items-center justify-between px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--whatsapp-accent)] text-white shadow-md">
              <MessageCircle size={15} />
            </span>
            <div>
              <p className="text-[13px] font-semibold leading-none">Chats</p>
              <p className="mt-1 text-[9px] font-medium uppercase text-[#89939d]">
                WhatsApp
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => void whatsapp.sync()}
              disabled={!whatsapp.account.connected || whatsapp.loading}
              className="grid h-8 w-8 place-items-center rounded-full border border-white/60 bg-white/45 text-[#66717c] shadow-sm transition hover:text-[var(--whatsapp-accent)] disabled:opacity-40 dark:border-white/10 dark:bg-white/5"
              title="Sync chats"
            >
              <RefreshCw
                size={14}
                className={whatsapp.loading ? "animate-spin" : ""}
              />
            </button>
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-full border border-white/60 bg-white/45 text-[#66717c] shadow-sm dark:border-white/10 dark:bg-white/5"
              title="New message"
            >
              <SquarePen size={15} />
            </button>
          </div>
        </div>
        <div className="px-3.5 pb-3">
          <label className="flex h-9 items-center gap-2 rounded-xl border border-white/70 bg-white/60 px-3 text-[#7d8994] shadow-sm focus-within:border-[var(--whatsapp-accent)] dark:border-white/10 dark:bg-white/[0.07]">
            <Search size={17} />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search"
              className="min-w-0 flex-1 bg-transparent text-[13px] outline-none dark:text-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </label>
        </div>
        {whatsapp.conversations.length > 0 && (
          <div className="mx-3 grid shrink-0 grid-cols-4 gap-2 rounded-xl border border-white/65 bg-white/40 px-2 py-3 dark:border-white/[0.08] dark:bg-white/[0.035]">
            {whatsapp.conversations.slice(0, 4).map((conversation) => (
              <button
                key={conversation.chatId}
                type="button"
                onClick={() => setSelectedChatId(conversation.chatId)}
                className="group flex min-w-0 flex-col items-center"
              >
                <div
                  className={`relative grid h-12 w-12 place-items-center rounded-full text-sm font-semibold text-white shadow-md transition group-hover:scale-105 ${selectedChatId === conversation.chatId ? "ring-2 ring-[var(--whatsapp-accent)] ring-offset-2" : ""}`}
                  style={{ backgroundColor: avatarColor(conversation.chatId) }}
                >
                  {conversation.kind === "group" ? (
                    <Users size={19} />
                  ) : (
                    initials(conversation.title)
                  )}
                  {conversation.unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full border-2 border-white bg-[var(--whatsapp-accent)] px-1 text-[9px] text-white">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
                <span className="mt-1.5 w-full truncate text-[10px]">
                  {conversation.title.split(" ")[0]}
                </span>
              </button>
            ))}
          </div>
        )}
        <div
          className="mx-2 mt-3 min-h-0 flex-1 overflow-y-auto rounded-t-xl border-x border-t border-white/55 bg-white/30 dark:border-white/[0.06] dark:bg-black/10"
          style={{ scrollbarWidth: "thin" }}
        >
          {whatsapp.loading && !whatsapp.conversations.length && (
            <div className="space-y-1 p-2">
              {[0, 1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-[66px] animate-pulse rounded-lg bg-[#f1f3f4] dark:bg-white/5"
                />
              ))}
            </div>
          )}
          {!whatsapp.loading &&
            whatsapp.account.connected &&
            !filtered.length && (
              <div className="px-8 py-12 text-center text-[#7d8994]">
                <Search size={24} className="mx-auto mb-3 opacity-50" />
                <p className="text-xs">No chats found</p>
              </div>
            )}
          {filtered.map((conversation) => (
            <button
              key={conversation.chatId}
              type="button"
              onClick={() => {
                setSelectedChatId(conversation.chatId);
                setMessages([]);
                setError(null);
              }}
              className={`my-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${selectedChatId === conversation.chatId ? "bg-[var(--whatsapp-accent)] text-white shadow-lg" : "hover:bg-white/75 dark:hover:bg-white/[0.07]"}`}
            >
              <div
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: avatarColor(conversation.chatId) }}
              >
                {conversation.kind === "group" ? (
                  <Users size={20} />
                ) : (
                  initials(conversation.title)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <span className="truncate font-semibold">
                    {conversation.title}
                  </span>
                  <span className="shrink-0 text-[10px] opacity-75">
                    {formatTime(conversation.lastMessageAt)}
                  </span>
                </div>
                <div className="mt-1 flex justify-between gap-2">
                  <span className="truncate text-[11px] opacity-75">
                    {conversation.lastMessage || "WhatsApp conversation"}
                  </span>
                  {conversation.unreadCount > 0 && (
                    <span className="rounded-full bg-white px-1.5 text-[10px] font-bold text-[var(--whatsapp-accent)]">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowAccount((current) => !current)}
          className="flex h-14 shrink-0 items-center gap-3 border-t border-[#dce3e8] px-4 text-left transition hover:bg-[#f1f3f4] dark:border-white/10 dark:hover:bg-white/10"
        >
          <div
            className={`grid h-8 w-8 place-items-center rounded-full ${whatsapp.account.connected ? "bg-emerald-500 text-white" : "bg-[#dce3e8] text-[#7d8994] dark:bg-white/10"}`}
          >
            {whatsapp.account.connected ? (
              <Wifi size={15} />
            ) : (
              <Settings size={15} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">
              {whatsapp.account.displayName || "WhatsApp account"}
            </p>
            <p className="text-[10px] text-[#7d8994]">
              {whatsapp.account.connected
                ? "Connected securely"
                : whatsapp.account.status.replace("_", " ")}
            </p>
          </div>
          <ChevronDown
            size={15}
            className={`transition ${showAccount ? "rotate-180" : ""}`}
          />
        </button>
        {showAccount && (
          <div className="absolute inset-x-0 bottom-14 z-20 max-h-[80%] overflow-y-auto border-t border-[#dce3e8] bg-white shadow-[0_-18px_50px_rgba(23,33,43,0.18)] dark:border-white/10 dark:bg-[#17201e]">
            <WhatsAppAccountPanel />
          </div>
        )}
      </aside>

      <main
        className={`${showMobileSidebar ? "hidden" : "flex"} min-w-0 flex-1 flex-col sm:flex`}
      >
        {selected ? (
          <>
            <header className="flex h-[62px] shrink-0 items-center justify-between border-b border-white/70 bg-white/65 px-3 shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-[#17201e]/80 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedChatId(null)}
                  className="grid h-9 w-9 place-items-center rounded-full text-[var(--whatsapp-accent)] sm:hidden"
                  aria-label="Back to chats"
                >
                  <ArrowLeft size={20} />
                </button>
                <div
                  className="grid h-10 w-10 place-items-center rounded-full font-semibold text-white"
                  style={{ backgroundColor: avatarColor(selected.chatId) }}
                >
                  {selected.kind === "group" ? (
                    <Users size={18} />
                  ) : (
                    initials(selected.title)
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-[14px] font-semibold">
                    {selected.title}
                  </h2>
                  <p className="text-[11px] text-[#7d8994]">
                    {selected.kind === "group" ? "group" : "WhatsApp contact"}
                  </p>
                </div>
              </div>
              <div className="flex text-[#707b85]">
                <button
                  type="button"
                  onClick={() => void startCall("video")}
                  disabled={
                    Boolean(startingCall) ||
                    !whatsapp.account.permissions["whatsapp.send"]
                  }
                  className="grid h-9 w-9 place-items-center rounded-full hover:bg-black/5 disabled:opacity-40"
                  aria-label="Start WhatsApp video call"
                  title="Share and open a WhatsApp Web video call"
                >
                  {startingCall === "video" ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Video size={17} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => void startCall("audio")}
                  disabled={
                    Boolean(startingCall) ||
                    !whatsapp.account.permissions["whatsapp.send"]
                  }
                  className="grid h-9 w-9 place-items-center rounded-full hover:bg-black/5 disabled:opacity-40"
                  aria-label="Start WhatsApp audio call"
                  title="Share and open a WhatsApp Web audio call"
                >
                  {startingCall === "audio" ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Phone size={17} />
                  )}
                </button>
                <button
                  type="button"
                  className="grid h-9 w-9 place-items-center rounded-full hover:bg-black/5"
                  aria-label="Search conversation"
                >
                  <Search size={18} />
                </button>
                <button
                  type="button"
                  className="grid h-9 w-9 place-items-center rounded-full hover:bg-black/5"
                  aria-label="Conversation options"
                >
                  <MoreVertical size={18} />
                </button>
              </div>
            </header>
            <div
              className="relative min-h-0 flex-1 overflow-y-auto bg-[var(--whatsapp-soft)] px-3 py-5 dark:bg-[#0d1714] sm:px-6"
              style={{ scrollbarWidth: "thin" }}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-45"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 1px 1px, rgba(52,72,88,0.13) 1px, transparent 0)",
                  backgroundSize: "22px 22px",
                }}
              />
              <div className="relative flex min-h-full flex-col justify-end gap-1.5">
                {loadingMessages && (
                  <div className="mx-auto rounded-full bg-white/90 px-3 py-1.5 text-[11px] text-[#60717f]">
                    Loading messages...
                  </div>
                )}
                {!loadingMessages && !messages.length && !error && (
                  <div className="mx-auto rounded-full bg-[#79948a]/75 px-3 py-1.5 text-[11px] text-white">
                    No messages in this conversation
                  </div>
                )}
                {messages.map((message) => {
                  const outgoing = message.direction === "outgoing";
                  return (
                    <div
                      key={message._id || message.openWaMessageId}
                      className={`flex ${outgoing ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[86%] rounded-2xl border px-3.5 py-2 shadow-md backdrop-blur-xl sm:max-w-[74%] ${outgoing ? "rounded-br-md border-white/20 bg-[var(--whatsapp-accent)] text-white" : "rounded-bl-md border-white/70 bg-white/85 dark:border-white/10 dark:bg-[#202b27]/90"}`}
                      >
                        <Media message={message} />
                        {message.text && <MessageText text={message.text} />}
                        <div className="mt-1 flex justify-end">
                          <span
                            className={`flex shrink-0 items-center gap-0.5 text-[9px] ${outgoing ? "text-white/75" : "text-[#8d99a4]"}`}
                          >
                            {formatTime(message.sentAt)}
                            {outgoing && (
                              <MessageStatus status={message.status} />
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>
            <footer className="shrink-0 border-t border-white/70 bg-white/65 px-3 py-3 shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-[#17201e]/80 sm:px-5">
              {error && (
                <p className="mb-2 text-[11px] text-red-500">{error}</p>
              )}
              <form onSubmit={sendMessage} className="flex items-end gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void sendFile(file);
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={
                    sending || !whatsapp.account.permissions["whatsapp.send"]
                  }
                  className="grid h-10 w-10 place-items-center rounded-full text-[#707b85] disabled:opacity-40"
                  aria-label="Attach file"
                >
                  <Paperclip size={20} />
                </button>
                <div className="flex min-h-11 min-w-0 flex-1 items-center rounded-xl border border-white/80 bg-white/75 px-3 shadow-sm focus-within:border-[var(--whatsapp-accent)] dark:border-white/10 dark:bg-white/[0.07]">
                  <input
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    placeholder="Write a message..."
                    disabled={
                      sending || !whatsapp.account.permissions["whatsapp.send"]
                    }
                    className="min-w-0 flex-1 bg-transparent py-2.5 text-[13px] outline-none"
                  />
                  <button
                    type="button"
                    className="grid h-8 w-8 place-items-center text-[#7d8994]"
                    aria-label="Choose emoji"
                  >
                    <Smile size={19} />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={
                    !inputValue.trim() ||
                    sending ||
                    !whatsapp.account.permissions["whatsapp.send"]
                  }
                  className="grid h-11 w-11 place-items-center rounded-full bg-[var(--whatsapp-accent)] text-white shadow-lg disabled:bg-[#b8c2ca]"
                  aria-label="Send message"
                >
                  <Send size={18} />
                </button>
              </form>
            </footer>
          </>
        ) : (
          <div className="grid flex-1 place-items-center bg-[#e1e9e4] p-8 text-center dark:bg-[#0d1714]">
            <div>
              <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-[var(--whatsapp-accent)] text-white shadow-xl">
                <MessageCircle size={36} />
              </div>
              <h2 className="text-lg font-semibold">WhatsApp</h2>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-[#70808d]">
                Link your account, then select a conversation to start
                messaging.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
