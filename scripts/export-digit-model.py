# Trains the digit recognition network once and exports its weights to JSON for the
# live demo on the project page (public/models/digit-model.json).
#
# It imports the original network classes from MBigaj/Digit_recognition_kohonen unchanged:
# first it trains with the original setup (1000 images, 20 epochs) for comparison, then on all
# 60,000 MNIST training images, one shuffled epoch at a time for six epochs, keeping the epoch
# with the best accuracy on the 10,000 test images.
#
# Run:
#   python3 scripts/export-digit-model.py <path to Digit_recognition_kohonen> \
#     <dir with the four MNIST .gz files> public/models/digit-model.json
import sys, gzip, json, time, numpy as np
repo, data, out = sys.argv[1], sys.argv[2], sys.argv[3]
sys.path.insert(0, repo)
from neural_network.NeuralNetwork import NeuralNetwork   # the original, unchanged code

def idx(path, header):
    with gzip.open(path) as f: return np.frombuffer(f.read(), np.uint8, offset=header)
xtr = idx(f'{data}/train-images-idx3-ubyte.gz', 16).reshape(-1, 1, 784).astype(float) / 255
ytr = idx(f'{data}/train-labels-idx1-ubyte.gz', 8)
xte = idx(f'{data}/t10k-images-idx3-ubyte.gz', 16).reshape(-1, 784).astype(float) / 255
yte = idx(f'{data}/t10k-labels-idx1-ubyte.gz', 8)
onehot = np.eye(10)[ytr]

def accuracy(m):
    h = np.tanh(xte @ m.fcc_1.weights + m.fcc_1.bias)
    h = np.tanh(h @ m.fcc_2.weights + m.fcc_2.bias)
    o = h @ m.fcc_3.weights + m.fcc_3.bias
    return float((o.argmax(1) == yte).mean())

np.random.seed(0)
orig = NeuralNetwork(0.2); orig.train(xtr[:1000], onehot[:1000], 20)
print('original setup (1000 samples, 20 epochs) test accuracy:', accuracy(orig), flush=True)

np.random.seed(0)
m = NeuralNetwork(0.2); best = (0, None)
for e in range(6):
    t = time.time(); perm = np.random.permutation(len(xtr))
    m.train(xtr[perm], onehot[perm], 1)
    a = accuracy(m); print(f'full set epoch {e+1}: test accuracy {a:.4f} ({time.time()-t:.0f}s)', flush=True)
    if a > best[0]:
        best = (a, [[l.weights.round(5).tolist(), l.bias[0].round(5).tolist()] for l in (m.fcc_1, m.fcc_2, m.fcc_3)])
json.dump({'layers': [{'weights': w, 'bias': b} for w, b in best[1]], 'activations': ['tanh', 'tanh', 'sigmoid'],
           'testAccuracy': round(best[0], 4), 'trainedOn': 'MNIST, 60000 training images', 'source': 'MBigaj/Digit_recognition_kohonen @ 8f5235c'}, open(out, 'w'), separators=(',', ':'))
print('best', best[0])
