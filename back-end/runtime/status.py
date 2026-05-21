import torch
import asyncio

class device_status:
    def __init__(self):
        self.cuda = torch.cuda
        self.device = self.cuda.current_device() if self.get_cuda() else 0

    def get_cuda(self):
        return self.cuda.is_available()
    
    def get_device(self):
        return {
            "device": self.cuda.get_device_name(self.device),
        }

    def get_memory(self):
        free_memory, total_memory = self.cuda.mem_get_info(self.device)
        return {
            "now-memory": GB(self.cuda.memory_reserved(self.device)),
            "max-memory": GB(self.cuda.max_memory_reserved(self.device)),
            "free-memory" : GB(free_memory),
            "total-memory": GB(total_memory),
        }
        
    def reset_memory(self):
        self.cuda.reset_peak_memory_stats()

def GB(bytes: int) -> str:
    return f"{round(bytes / (1024**3), 2)} GB"
