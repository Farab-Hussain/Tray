import Image from "next/image";

const ServicesTop = () => {
  return (
    <div className="w-full h-48 bg-lightGreen rounded-lg flex justify-between items-center">
      <div className="w-full h-full flex items-start gap-2 justify-center flex-col p-6">
        <h1 className="text-4xl font-bold text-black">Welcome Consultant</h1>
        <h5 className="text-lg font-normal text-gray/50">
          Browse and apply for services you want to offer
        </h5>
      </div>
      <div className="w-full h-full flex justify-center items-center relative">
        <Image 
          src="/images/banner.png" 
          alt="Logo" 
          width={250} 
          height={600} 
          className="absolute bottom-0 right-5" 
        />
      </div>
    </div>
  );
};

export default ServicesTop;
