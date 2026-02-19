import whatsappIcon from "@assets/whatsapp-icon.png";

const WhatsAppButton = () => {
  const handleWhatsApp = () => {
    window.open("https://wa.me/918584049992", "_blank");
  };

  return (
    <button
      onClick={handleWhatsApp}
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 p-0 rounded-full shadow-lg transition-all hover:scale-110"
      aria-label="Contact on WhatsApp"
      title="WhatsApp"
      data-testid="button-whatsapp"
    >
      <img src={whatsappIcon} alt="WhatsApp" className="h-12 w-12 sm:h-14 sm:w-14" />
    </button>
  );
};

export default WhatsAppButton;