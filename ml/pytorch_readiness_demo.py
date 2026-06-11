import torch
from torch import nn


class ReadinessNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.layers = nn.Sequential(
            nn.Linear(5, 16),
            nn.ReLU(),
            nn.Linear(16, 8),
            nn.ReLU(),
            nn.Linear(8, 1),
            nn.Sigmoid(),
        )

    def forward(self, features):
        return self.layers(features)


def main():
    model = ReadinessNet()
    sample = torch.tensor([[15.0, 155.0, 60.0, 40.0, 0.65]])
    normalized = sample / torch.tensor([[100.0, 220.0, 180.0, 90.0, 1.0]])
    score = model(normalized).item()
    print(f"PyTorch readiness demo score: {round(score * 100)}")


if __name__ == "__main__":
    main()
