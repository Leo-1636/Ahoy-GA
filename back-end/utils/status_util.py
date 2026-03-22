import torch

def GB(value: int) -> int:
    return f"{round(value / (1024**3), 2)} GB"

def get_status():
    if not torch.cuda.is_available():
        return {"mode": "CPU"}
    else:
        device = torch.cuda.current_device()
        device_name = torch.cuda.get_device_name(device)
        used_memory = torch.cuda.memory_allocated(device)
        total_memory = torch.cuda.get_device_properties(device).total_memory

        return {
            "mode": "GPU", 
            "device": device_name, 
            "used_memory": GB(used_memory), 
            "total_memory": GB(total_memory),
        }