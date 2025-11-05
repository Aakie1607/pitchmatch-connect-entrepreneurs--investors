"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Navigation from "@/components/Navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Search, MessageCircle, User, Clock, Check, CheckCheck } from "lucide-react";

interface Connection {
  id: number;
  status: string;
  requesterProfile: any;
  recipientProfile: any;
}

interface Message {
  id: number;
  content: string;
  senderId: number;
  isRead: boolean;
  createdAt: string;
  sender: any;
}

export default function MessagesPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [filteredConnections, setFilteredConnections] = useState<Connection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [lastTypingTime, setLastTypingTime] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user) return;

      try {
        const token = localStorage.getItem("bearer_token");
        const response = await fetch("/api/profiles/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCurrentProfile(data);
        }
      } catch (error) {
        console.error("Failed to fetch profile");
      }
    };

    fetchProfile();
  }, [session]);

  useEffect(() => {
    const fetchConnections = async () => {
      if (!currentProfile) return;

      try {
        const token = localStorage.getItem("bearer_token");
        const response = await fetch("/api/connections?status=accepted", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setConnections(data);
          setFilteredConnections(data);
        }
      } catch (error) {
        toast.error("Failed to load connections");
      } finally {
        setIsLoading(false);
      }
    };

    fetchConnections();
  }, [currentProfile]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConnection) return;

      try {
        const token = localStorage.getItem("bearer_token");
        const response = await fetch(
          `/api/messages/connection/${selectedConnection.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setMessages(data);
          
          // Mark messages as read
          const unreadMessages = data.filter(
            (msg: Message) => !msg.isRead && msg.senderId !== currentProfile?.id
          );
          
          unreadMessages.forEach(async (msg: Message) => {
            await fetch(`/api/messages/${msg.id}/read`, {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
          });
        }
      } catch (error) {
        toast.error("Failed to load messages");
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);

    return () => clearInterval(interval);
  }, [selectedConnection, currentProfile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = connections.filter((conn) => {
        const otherProfile = getOtherProfile(conn);
        const name = otherProfile?.userId?.toLowerCase() || "";
        return name.includes(searchQuery.toLowerCase());
      });
      setFilteredConnections(filtered);
    } else {
      setFilteredConnections(connections);
    }
  }, [searchQuery, connections]);

  const handleTyping = () => {
    const now = Date.now();
    setLastTypingTime(now);
    
    if (!isTyping) {
      setIsTyping(true);
    }

    // Stop typing indicator after 2 seconds of no activity
    setTimeout(() => {
      const currentTime = Date.now();
      if (currentTime - now >= 2000) {
        setIsTyping(false);
      }
    }, 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConnection || !currentProfile) return;

    setIsSending(true);
    setIsTyping(false);
    
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          connectionId: selectedConnection.id,
          content: newMessage.trim(),
        }),
      });

      if (response.ok) {
        const message = await response.json();
        setMessages([...messages, { ...message, sender: { id: currentProfile.id } }]);
        setNewMessage("");
        messageInputRef.current?.focus();
      } else {
        toast.error("Failed to send message");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSending(false);
    }
  };

  const getOtherProfile = (connection: Connection) => {
    if (!currentProfile) return null;
    return connection.requesterProfile.id === currentProfile.id
      ? connection.recipientProfile
      : connection.requesterProfile;
  };

  const formatMessageTime = (createdAt: string) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isPending || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4 mb-6"
          >
            <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded-lg animate-pulse" />
          </motion.div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="h-[600px] bg-muted rounded-2xl animate-pulse" />
            <div className="lg:col-span-2 h-[600px] bg-muted rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold text-foreground">Messages</h1>
          <p className="mt-1 text-muted-foreground">
            Chat with your connections in real-time
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3 lg:h-[calc(100vh-240px)]">
          {/* Connections List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-1"
          >
            <div className="rounded-2xl border border-border bg-card shadow-sm h-full flex flex-col overflow-hidden">
              <div className="border-b border-border p-4">
                <h2 className="font-semibold text-foreground mb-3">
                  Connections ({connections.length})
                </h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search connections..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="popLayout">
                  {filteredConnections.length > 0 ? (
                    filteredConnections.map((connection, index) => {
                      const otherProfile = getOtherProfile(connection);
                      if (!otherProfile) return null;

                      return (
                        <motion.button
                          key={connection.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.02, x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedConnection(connection)}
                          className={`w-full p-4 text-left transition-all border-b border-border ${
                            selectedConnection?.id === connection.id
                              ? "bg-primary/10"
                              : "hover:bg-accent"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative flex-shrink-0">
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-lg">
                                {otherProfile.userId?.charAt(0) || "U"}
                              </div>
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-card"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">
                                {otherProfile.userId}
                              </p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {otherProfile.role}
                              </p>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-8 text-center"
                    >
                      {searchQuery ? (
                        <div>
                          <Search className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                          <p className="text-sm text-muted-foreground">
                            No connections found
                          </p>
                        </div>
                      ) : (
                        <div>
                          <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                          <p className="text-sm text-muted-foreground">
                            No connections yet. Start browsing to connect with others!
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Messages Area */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-2"
          >
            {selectedConnection ? (
              <div className="rounded-2xl border border-border bg-card shadow-sm h-full flex flex-col overflow-hidden">
                {/* Chat Header */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-b border-border p-4 bg-card"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-lg">
                      {getOtherProfile(selectedConnection)?.userId?.charAt(0) || "U"}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {getOtherProfile(selectedConnection)?.userId}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize flex items-center gap-1.5">
                        <motion.span
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="h-2 w-2 rounded-full bg-green-500"
                        />
                        Online
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
                  <AnimatePresence initial={false}>
                    {messages.map((message, index) => {
                      const isOwn = message.senderId === currentProfile?.id;
                      const showAvatar = 
                        index === 0 || 
                        messages[index - 1].senderId !== message.senderId;
                      const isLastMessage = index === messages.length - 1;

                      return (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ 
                            type: "spring", 
                            stiffness: 500, 
                            damping: 30,
                            delay: index * 0.02 
                          }}
                          className={`flex gap-3 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
                        >
                          <div className={`flex-shrink-0 ${showAvatar ? "" : "invisible"}`}>
                            {!isOwn && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-sm"
                              >
                                {getOtherProfile(selectedConnection)?.userId?.charAt(0) || "U"}
                              </motion.div>
                            )}
                          </div>
                          <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[70%]`}>
                            <motion.div
                              initial={{ scale: 0.9 }}
                              animate={{ scale: 1 }}
                              whileHover={{ scale: 1.02 }}
                              className={`rounded-2xl px-4 py-3 shadow-sm ${
                                isOwn
                                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                                  : "bg-card text-foreground border border-border rounded-tl-sm"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                            </motion.div>
                            <div className="mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">
                                {formatMessageTime(message.createdAt)}
                              </p>
                              {isOwn && (
                                <motion.div
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ delay: 0.2 }}
                                >
                                  {message.isRead ? (
                                    <CheckCheck className="h-3 w-3 text-primary" />
                                  ) : (
                                    <Check className="h-3 w-3 text-muted-foreground" />
                                  )}
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Typing Indicator */}
                  <AnimatePresence>
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex gap-3"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-sm">
                          {getOtherProfile(selectedConnection)?.userId?.charAt(0) || "U"}
                        </div>
                        <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                          <div className="flex gap-1">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                animate={{ y: [0, -8, 0] }}
                                transition={{
                                  duration: 0.6,
                                  repeat: Infinity,
                                  delay: i * 0.15,
                                }}
                                className="h-2 w-2 rounded-full bg-muted-foreground"
                              />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <motion.form
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={handleSendMessage}
                  className="border-t border-border p-4 bg-card"
                >
                  <div className="flex gap-3">
                    <input
                      ref={messageInputRef}
                      type="text"
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                      }}
                      placeholder="Type your message..."
                      className="flex-1 rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      disabled={isSending}
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      disabled={isSending || !newMessage.trim()}
                      className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                    >
                      {isSending ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full"
                        />
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span className="hidden sm:inline">Send</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.form>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-border bg-card h-full flex items-center justify-center p-12 text-center"
              >
                <div>
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4"
                  >
                    <MessageCircle className="h-10 w-10 text-primary" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-muted-foreground">
                    Choose a connection from the list to start messaging
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}