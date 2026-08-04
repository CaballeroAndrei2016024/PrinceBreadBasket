// pages/print-component.js
"use client";
import { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import Image from "next/image";
import printIcon from "@/public/print.png";
import printHoverIcon from "@/public/printhover.png";

export default function PrintButton() {
  const contentRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef,
  });

  const [hover, isHover] = useState(false);
  return (
    <div>
      <div ref={contentRef}>
        <button
          onClick={handlePrint}
          onMouseEnter={() => isHover(true)}
          onMouseLeave={() => isHover(false)}
          ria-label="Print"
          className="p-2 rounded-lg transition-colors duration-200 hover:bg-gray-200"
        >
          <Image
            src={hover ? printHoverIcon : printIcon}
            alt="Print"
            width={32}
            height={32}
          />
        </button>
      </div>
    </div>
  );
}
