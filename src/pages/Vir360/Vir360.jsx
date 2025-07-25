function Vir360() {
  return (<div>
      <iframe
        src="HTML/index.htm"
        title="Virtual Tour"
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
      />
    </div>);
}

export default Vir360;
