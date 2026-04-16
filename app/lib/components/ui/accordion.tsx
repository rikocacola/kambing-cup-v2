import { useState } from "react";
import { ChevronDown } from "lucide-react";

type AccordionItem = {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
  defaultOpen?: boolean;
};

export const Accordion = ({
  items,
}: {
  items: AccordionItem[];
}) => {
  const [openId, setOpenId] = useState<string | null>(
    items.find((item) => item.defaultOpen)?.id || null
  );

  return (
    <div className="space-y-2 border rounded-lg overflow-hidden">
      {items.map((item, index) => (
        <div key={item.id} className={index !== 0 ? "border-t" : ""}>
          <button
            onClick={() =>
              setOpenId(openId === item.id ? null : item.id)
            }
            className="w-full flex items-center justify-between gap-4 px-4 py-3 hover:bg-gray-50 transition-colors text-left font-medium text-gray-900"
          >
            {item.title}
            <ChevronDown
              className={`size-5 transition-transform text-gray-600 flex-shrink-0 ${
                openId === item.id ? "rotate-180" : ""
              }`}
            />
          </button>
          {openId === item.id && (
            <div className="px-4 py-3 bg-gray-50 border-t">
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
