import { useEffect } from 'react';
import { Bell } from 'lucide-react';

const MessageToast = ({ name, message }) => {
 
   
 
 

  return (
    <div className="flex items-center gap-3">
      <div>
        <div className="flex items-center gap-1 font-semibold text-white">
          {name}
          <Bell className="w-4 h-4 text-yellow-400 animate-bounce" />
        </div>
        <div className="text-sm text-gray-300">Message: {message}</div>
      </div>
    </div>
  );
};

export default MessageToast;
