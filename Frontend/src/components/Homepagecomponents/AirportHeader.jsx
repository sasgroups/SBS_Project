import React from "react";
import Language from "../Language";
import { designTokens } from "../../styles/designTokens";

const AirportHeader = () => {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center w-full">
        <div className="flex w-full items-center gap-4">
          <Language />
        </div>
      </div>
    </div>
  );
};

export default AirportHeader;