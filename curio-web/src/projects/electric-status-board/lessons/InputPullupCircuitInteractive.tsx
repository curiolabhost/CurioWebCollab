"use client";

import { useState } from "react";
import { Zap, AlertCircle, CheckCircle2 } from "lucide-react";

export default function InputPullupCircuitInteractive() {
  const [buttonPressed, setButtonPressed] = useState(false);

  return (
    <div className="w-full pt-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-red-400"> Input Pullup Circuit Diagram</h2>
        <p className="text-gray-600 mt-2">
          Click the button to toggle the switch and watch the pin state change.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Circuit Diagram */}
        <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-lg">
          <div className="relative" style={{ height: "500px" }}>
            <svg className="w-full h-full" viewBox="0 0 300 500">
              {/* Vcc Label */}
              {/* Arduino Body */}
                <rect
                x="90"
                y="2"
                width="290"
                height="216"
                rx="16"
                ry="16"
                fill="#f8eff17b"     // dark Arduino body
                stroke="#dacfcf5b"
                strokeWidth="2"
                />
              <text x="240" y="18" textAnchor="middle" className="text-sm fill-pink-300 font-semibold">
                Arduino
              </text>

              <text x="150" y="25" textAnchor="middle" className="text-sm fill-red-600 font-semibold">
                Vcc (+5V)
              </text>

              {/* Vcc Line */}
              <line x1="150" y1="35" x2="150" y2="60" stroke="#DC2626" strokeWidth="3" />

              {/* Internal Pull-up Resistor */}
              <rect x="130" y="60" width="40" height="80" fill="none" stroke="#F59E0B" strokeWidth="2" />
              <line x1="135" y1="75" x2="165" y2="75" stroke="#F59E0B" strokeWidth="2" />
              <line x1="135" y1="85" x2="165" y2="85" stroke="#F59E0B" strokeWidth="2" />
              <line x1="135" y1="95" x2="165" y2="95" stroke="#F59E0B" strokeWidth="2" />
              <line x1="135" y1="105" x2="165" y2="105" stroke="#F59E0B" strokeWidth="2" />
              <line x1="135" y1="115" x2="165" y2="115" stroke="#F59E0B" strokeWidth="2" />
              <line x1="135" y1="125" x2="165" y2="125" stroke="#F59E0B" strokeWidth="2" />
              <text x="180" y="105" className="text-xs fill-gray-600">Internal</text>
              <text x="180" y="118" className="text-xs fill-gray-600">Pull-up</text>
              <text x="180" y="131" className="text-xs fill-gray-600">(20-50kΩ)</text>

              {/* Line to junction */}
              <line x1="150" y1="140" x2="150" y2="200" stroke="#111c2dff" strokeWidth="3" />

              {/* Junction point */}
              <circle cx="150" cy="200" r="5" fill="#111c2dff" />

              {/* Line to Digital Pin */}
              <line x1="150" y1="200" x2="250" y2="200" stroke="#111c2dff" strokeWidth="3" />

              {/* Digital Pin Label */}
              <rect x="250" y="185" width="40" height="30" fill="#6366F1" stroke="#4F46E5" strokeWidth="2" rx="4" />
              <text x="270" y="205" textAnchor="middle" className="text-xs fill-white font-semibold">
                PIN
              </text>
              <text x="328" y="205" textAnchor="middle" className="text-sm fill-gray-700 font-semibold">
                Digital Pin
              </text>

              {/* Pin State Indicator */}
              <rect
                x="250"
                y="220"
                width="40"
                height="30"
                fill={buttonPressed ? "#e68181ff" : "#9ac6b8ff"}
                stroke={buttonPressed ? "#DC2626" : "#059669"}
                strokeWidth="2"
                rx="15"
              />
              <text x="270" y="240" textAnchor="middle" className="text-xs fill-white font-semibold">
                {buttonPressed ? "LOW" : "HIGH"}
              </text>

              {/* Line down to button */}
              <line x1="150" y1="200" x2="150" y2="300" stroke="#111c2dff" strokeWidth="3" />

              {/* Button/Switch */}
              <g transform="translate(150, 300)">
                <rect x="-15" y="-10" width="30" height="60" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="2" rx="4" />

                {buttonPressed ? (
                  <line x1="-0" y1="-10" x2="0" y2="50" stroke="#059669" strokeWidth="4" strokeLinecap="round" />
                ) : (
                  <line x1="-0" y1="-10" x2="30" y2="40" stroke="#6B7280" strokeWidth="4" strokeLinecap="round" />
                )}

                <text x="-70" y="5" textAnchor="middle" className="text-sm fill-gray-700 font-semibold">
                  Button
                </text>
                <text x="-70" y="20" textAnchor="middle" className="text-xs fill-gray-500">
                  ({buttonPressed ? "Pressed" : "Not Pressed"})
                </text>
              </g>

              {/* Line to Ground */}
              <line x1="150" y1="350" x2="150" y2="420" stroke="#111c2dff" strokeWidth="3" />

              {/* Ground symbol */}
              <line x1="150" y1="420" x2="150" y2="430" stroke="#000" strokeWidth="3" />
              <line x1="130" y1="430" x2="170" y2="430" stroke="#000" strokeWidth="3" />
              <line x1="138" y1="440" x2="162" y2="440" stroke="#000" strokeWidth="2" />
              <line x1="145" y1="448" x2="155" y2="448" stroke="#000" strokeWidth="2" />
              <text x="150" y="475" textAnchor="middle" className="text-sm fill-gray-900 font-semibold">
                GND
              </text>
            
            {!buttonPressed && (
                <>
                  <defs>
                    <marker id="arrowhead-current" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                      <polygon points="0 0, 10 3, 0 6" fill="#DC2626" />
                    </marker>
                  </defs>

                  <line
                    x1="150"
                    y1="50"
                    x2="150"
                    y2="190"
                    stroke="#DC2626"
                    strokeWidth="3"
                    strokeDasharray="5,5"
                    markerEnd="url(#arrowhead-current)"
                    opacity="0.6"
                  />
                  <line
                    x1="150"
                    y1="200"
                    x2="240"
                    y2="200"
                    stroke="#DC2626"
                    strokeWidth="3"
                    strokeDasharray="5,5"
                    markerEnd="url(#arrowhead-current)"
                    opacity="0.6"
                  />
                </>
              )}


              {/* Current Flow Arrows (only when pressed) */}
              {buttonPressed && (
                <>
                  <defs>
                    <marker id="arrowhead-current" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                      <polygon points="0 0, 10 3, 0 6" fill="#DC2626" />
                    </marker>
                  </defs>

                  <line
                    x1="150"
                    y1="50"
                    x2="150"
                    y2="190"
                    stroke="#DC2626"
                    strokeWidth="3"
                    strokeDasharray="5,5"
                    markerEnd="url(#arrowhead-current)"
                    opacity="0.6"
                  />
                  <line
                    x1="150"
                    y1="210"
                    x2="150"
                    y2="290"
                    stroke="#DC2626"
                    strokeWidth="3"
                    strokeDasharray="5,5"
                    markerEnd="url(#arrowhead-current)"
                    opacity="0.6"
                  />
                  <line
                    x1="150"
                    y1="330"
                    x2="150"
                    y2="410"
                    stroke="#DC2626"
                    strokeWidth="3"
                    strokeDasharray="5,5"
                    markerEnd="url(#arrowhead-current)"
                    opacity="0.6"
                  />
                </>
              )}
            </svg>
          </div>

          <div className="flex justify-center mt-4">
            <button
              onClick={() => setButtonPressed(!buttonPressed)}
              className={`px-8 py-4 rounded-xl font-semibold transition-all shadow-lg ${
                buttonPressed ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gray-600 hover:bg-gray-700 text-white"
              }`}
            >
              {buttonPressed ? "Release Button" : "Press Button"}
            </button>
          </div>
        </div>

        {/* State Explanation */}
        <div className="space-y-6">
          <div
            className={`bg-white rounded-xl p-6 border-2 transition-all ${
              !buttonPressed ? "border-green-400 shadow-lg" : "border-gray-200"
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className={`w-6 h-6 ${!buttonPressed ? "text-green-600" : "text-gray-400"}`} />
              <h3 className="text-lg font-semibold text-gray-900">Button NOT Pressed (Open)</h3>
            </div>
            <div className="space-y-3 text-sm text-gray-700">
              <p>• The internal pull-up resistor connects the pin to Vcc (+5V)</p>
              <p>• No complete path to ground</p>
              <p>• Pin is pulled up to HIGH</p>
              <p className="px-3 py-2 bg-green-100 text-green-800 rounded-md inline-block">
                digitalRead(pin) returns <strong>HIGH</strong>
              </p>
            </div>
          </div>

          <div
            className={`bg-white rounded-xl p-6 border-2 transition-all ${
              buttonPressed ? "border-red-400 shadow-lg" : "border-gray-200"
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <Zap className={`w-6 h-6 ${buttonPressed ? "text-red-600" : "text-gray-400"}`} />
              <h3 className="text-lg font-semibold text-gray-900">Button Pressed (Closed)</h3>
            </div>
            <div className="space-y-3 text-sm text-gray-700">
              <p>• Button connects the pin directly to GND</p>
              <p>• Current flows: Vcc → pull-up → pin → button → GND</p>
              <p>• GND “wins” and forces the pin LOW</p>
              <p className="px-3 py-2 bg-red-100 text-red-800 rounded-md inline-block">
                digitalRead(pin) returns <strong>LOW</strong>
              </p>
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-6 border-2 border-amber-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-900 font-semibold mb-2">Why is the logic inverted?</p>
                <p className="text-sm text-amber-800">
                  With INPUT_PULLUP, the pin is HIGH by default, and pressing the button pulls it LOW.
                  So your code checks for LOW to detect a press.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
