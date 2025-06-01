function PointCloud() {
  return (
          <iframe
            src="/src/components/pages/PointCloud/PotreeViewer.html"
            title="Potree Viewer"
            width="100%"
            height="100%"
            style={{
              position: "fixed",
              top: 58,
              left: 0,
              border: "none",
              width: "100vw",
              height: "calc(100vh - 58px)",
              zIndex: 0,
          }}
        />);
}

export default PointCloud;
