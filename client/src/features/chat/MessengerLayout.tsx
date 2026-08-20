import React, { act, useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Sidebar } from "../chat/components/Sidebar";
import { ChatArea } from "../chat/components/ChatArea";
import { SettingsView } from "../chat/components/SettingsView";
import { AddUserDialog } from "../chat/components/AddUserDialog";
import { CreateGroupDialog } from "../../features/chat/components/CreateGroupDialog";
import { User, Conversation } from "../../types/types";
import { messengerStore } from "../../messangerStore/messengerStore";
import { MessageSquare, ArrowLeft } from "lucide-react";

interface MessengerLayoutProps {
  currentUser: User;
  onLogout: () => void;
  onCurrentUserChange: (user: User) => void;
}

export const MessengerLayout: React.FC<MessengerLayoutProps> = ({
  currentUser,
  onLogout,
  onCurrentUserChange,
}) => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [refreshKey, setRefreshKey] = useState(0);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  // const [conversations, setConversations] = useState([]);

  const isSettings = location.pathname.includes("/settings");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<
    Conversation | undefined
  >(undefined);

  const loadConversations = async () => {
    try {
      const result = await messengerStore.getConversations(currentUser.id);
      setConversations(result);

      if (conversationId) {
        const active = result.find((c) => c.id === conversationId);

        setActiveConversation(active);
      } else {
        setActiveConversation(result[0] ?? null);
      }

      // return result;
    } catch (error) {
      console.error("Failed to load conversations:", error);
      return [];
    }
  };

  useEffect(() => {
    loadConversations();
  }, [currentUser.id, conversationId, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleSelectConversation = (id: string) => {
    navigate(`/app/chat/${id}`);
  };

  const handleUserAdded = async (user: User) => {
    const updatedConversations = await loadConversations();

    const created = updatedConversations.find(
      (c) => c.type === "DIRECT" && c.members.some((m) => m.userId === user.id),
    );

    if (created) {
      navigate(`/app/chat/${created.id}`);
    }
  };

  const handleGroupCreated = (group: Conversation) => {
    handleRefresh();
    navigate(`/app/chat/${group.id}`);
  };

  return (
    <div className="h-screen w-screen bg-black text-zinc-100 flex overflow-hidden font-sans">
      {/* SIDEBAR - Shown on large screens or when no chat active on mobile */}
      <div
        className={`${
          conversationId || isSettings ? "hidden lg:block" : "block"
        } w-full lg:w-80 h-full flex-shrink-0`}
      >
        <Sidebar
          currentUser={currentUser}
          conversations={conversations}
          activeConversationId={activeConversation?.id}
          onSelectConversation={handleSelectConversation}
          onOpenAddUser={() => setIsAddUserOpen(true)}
          onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
          onLogout={onLogout}
        />
      </div>

      {/* MAIN CONTENT AREA (Chat Area or Settings) */}
      <div
        className={`${
          !conversationId && !isSettings ? "hidden lg:flex" : "flex"
        } flex-1 h-full flex-col relative`}
      >
        {/* Mobile Back Button when inside chat or settings */}
        {(conversationId || isSettings) && (
          <div className="lg:hidden p-3 bg-zinc-950 border-b border-zinc-800 flex items-center gap-2">
            <button
              onClick={() => navigate("/app")}
              className="p-2 rounded-xl bg-zinc-900 text-zinc-300 flex items-center gap-1 text-xs font-semibold"
            >
              <ArrowLeft size={16} /> Back to Conversations
            </button>
          </div>
        )}

        {isSettings ? (
          <SettingsView
            currentUser={currentUser}
            onLogout={onLogout}
            onProfileUpdated={handleRefresh}
            onCurrentUserChange={onCurrentUserChange}
          />
        ) : activeConversation ? (
          <ChatArea
            key={`${activeConversation.id}_${refreshKey}`}
            conversation={activeConversation}
            currentUser={currentUser}
            onRefresh={handleRefresh}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <MessageSquare size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">
                Luma File Messenger
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm">
                Select a conversation or add a user by public UID to start
                sharing photos, videos, and files.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* DIALOGS */}
      <AddUserDialog
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        onUserAdded={handleUserAdded}
        currentUserId={currentUser.id}
      />

      <CreateGroupDialog
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onGroupCreated={handleGroupCreated}
        currentUserId={currentUser.id}
      />
    </div>
  );
};
