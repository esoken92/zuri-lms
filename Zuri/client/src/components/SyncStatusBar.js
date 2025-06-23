import { ArrowPathIcon } from '@heroicons/react/24/solid';
import Toast from './Toast';

function SyncStatusBar({
  syncing,
  pendingCount,
  forceSync,
  isOnline,
  syncAttempt,
  lastSyncStatus,
}) {
  let bgColorClass = 'bg-gray-400';
  let text = 'Offline';

  if (isOnline && pendingCount === 0 && !syncing) {
    bgColorClass = 'bg-green-600';
    text = 'Up to date';
  } else if (syncing) {
    bgColorClass = 'bg-orange-500';
    text = `Syncing... Attempt ${syncAttempt}`;
  } else if (isOnline && pendingCount > 0) {
    bgColorClass = 'bg-yellow-500';
    text = `${pendingCount} pending sync`;
  } else {
    bgColorClass = 'bg-red-600';
    text = 'Offline';
  }

  return (
    <>
      <div
        className={`text-white text-sm py-2 px-4 text-center sticky top-0 z-50 ${bgColorClass}`}
      >
        <strong>Status:</strong> {text}
        <button
          onClick={forceSync}
          disabled={syncing}
          className="ml-4 p-2 rounded-full bg-white text-black hover:bg-gray-300 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
          title="Sync Now"
        >
          <ArrowPathIcon className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {lastSyncStatus && (
        <Toast
          type={lastSyncStatus === 'success' ? 'success' : 'error'}
          message={
            lastSyncStatus === 'success'
              ? '✅ Sync Successful'
              : '❌ Sync Unsuccessful'
          }
        />
      )}
    </>
  );
}

export default SyncStatusBar;
