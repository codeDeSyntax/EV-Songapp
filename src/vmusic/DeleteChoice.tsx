import {motion} from "framer-motion"
import {CheckCircle,AlertCircle} from "lucide-react"

const DeleteChoice = ({
    message,
    type = "success",
  }: {
    message: string;
    type?: "success" | "error" | "warning";
  }) => {
    const bgColor = {
      success: "bg-[#9a674a]",
      error: "bg-red-500",
      warning: "bg-amber-500",
    }[type];
  
    return (
      <motion.div
        initial={{ opacity: 0, y: -50, x: "-50%" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-8 left-1/2 z-50"
      >
        <div
          className={`flex items-center gap-2 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg`}
        >
          {type === "success" ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="font-medium">{message}</span>
        </div>
      </motion.div>
    );
  };

  export default DeleteChoice