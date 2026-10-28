function Gallery() {
  const photos = ["A1.jpg", "A2.jpg", "A3.jpg", "A4.jpg"];

  return (
    <section className="gallery">
      <h1>My Gallery</h1>

      <div className="photo-grid">
        {photos.map((photo) => (
          <img
            key={photo}
            src={`/${photo}`}
            alt="Gallery"
          />
        ))}
      </div>
    </section>
  );
}

export default Gallery;