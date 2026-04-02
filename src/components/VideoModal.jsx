const DEFAULT_VIDEO_ID = 'MDQVBE4T6lk';

function getVideoSrc(video) {
  if (video?.embedUrl) return `${video.embedUrl}?autoplay=1&rel=0`;
  return `https://www.youtube.com/embed/${video?.youtubeId || DEFAULT_VIDEO_ID}?autoplay=1&rel=0`;
}

export default function VideoModal({ open, video, onClose }) {
  if (!open || !video) return null;

  return (
    <div
      className="modal-overlay show video-player-overlay"
      onClick={(e) => {
        if (e.target.classList.contains('modal-overlay')) onClose();
      }}
    >
      <div
        className="modal"
        style={{ maxWidth: 860, width: 'calc(100% - 32px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h3>{video.title}</h3>
            <div className="txt-sm" style={{ color: 'var(--text-muted)', marginTop: 4 }}>
              {video.folder}
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="form-body" style={{ paddingTop: 0 }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              paddingTop: '56.25%',
              borderRadius: 12,
              overflow: 'hidden',
              background: '#000',
            }}
          >
            <iframe
              src={getVideoSrc(video)}
              title={`${video.title} player`}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </div>
  );
}
