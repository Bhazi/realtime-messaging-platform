export default function MessengerLayoutSkeleton() {
  return (
    <div className="h-screen w-screen bg-black text-zinc-100 flex overflow-hidden font-sans">
      {/* SIDEBAR */}
      <div className="w-full lg:w-80 h-full flex-shrink-0 bg-zinc-950 border-r border-zinc-800">
        {/* Sidebar Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-zinc-800 animate-pulse" />

            <div className="space-y-2">
              {/* Name */}
              <div className="h-3.5 w-24 rounded bg-zinc-800 animate-pulse" />

              {/* Status */}
              <div className="h-2.5 w-16 rounded bg-zinc-900 animate-pulse" />
            </div>
          </div>

          {/* Header buttons */}
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 animate-pulse" />
            <div className="w-8 h-8 rounded-lg bg-zinc-900 animate-pulse" />
          </div>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="h-10 w-full rounded-xl bg-zinc-900 animate-pulse" />
        </div>

        {/* Conversations */}
        <div className="px-3 space-y-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded-xl">
              {/* Avatar */}
              <div className="w-11 h-11 rounded-full bg-zinc-800 animate-pulse flex-shrink-0" />

              {/* Conversation info */}
              <div className="flex-1 min-w-0 space-y-2">
                <div
                  className="h-3.5 rounded bg-zinc-800 animate-pulse"
                  style={{
                    width: `${80 + (index % 3) * 30}px`,
                  }}
                />

                <div
                  className="h-2.5 rounded bg-zinc-900 animate-pulse"
                  style={{
                    width: `${60 + (index % 4) * 20}px`,
                  }}
                />
              </div>

              {/* Time */}
              <div className="w-8 h-2.5 rounded bg-zinc-900 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="hidden lg:flex flex-1 h-full flex-col relative bg-black">
        {/* Chat Header */}
        <div className="h-16 flex-shrink-0 px-5 flex items-center border-b border-zinc-800 bg-zinc-950">
          <div className="w-10 h-10 rounded-full bg-zinc-800 animate-pulse" />

          <div className="ml-3 space-y-2">
            <div className="h-3.5 w-32 rounded bg-zinc-800 animate-pulse" />
            <div className="h-2.5 w-20 rounded bg-zinc-900 animate-pulse" />
          </div>

          <div className="ml-auto flex gap-2">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 animate-pulse" />
            <div className="w-9 h-9 rounded-lg bg-zinc-900 animate-pulse" />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 flex flex-col justify-end gap-4 p-6">
          <div className="flex">
            <div className="h-10 w-52 rounded-2xl rounded-bl-md bg-zinc-900 animate-pulse" />
          </div>

          <div className="flex justify-end">
            <div className="h-10 w-64 rounded-2xl rounded-br-md bg-indigo-500/20 animate-pulse" />
          </div>

          <div className="flex">
            <div className="h-14 w-72 rounded-2xl rounded-bl-md bg-zinc-900 animate-pulse" />
          </div>

          <div className="flex justify-end">
            <div className="h-10 w-44 rounded-2xl rounded-br-md bg-indigo-500/20 animate-pulse" />
          </div>

          <div className="flex">
            <div className="h-10 w-60 rounded-2xl rounded-bl-md bg-zinc-900 animate-pulse" />
          </div>
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950">
          <div className="h-12 w-full rounded-xl bg-zinc-900 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
