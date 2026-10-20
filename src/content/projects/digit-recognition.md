---
title: Digit recognition
order: 3
status: shipped
summary: A neural network written by hand that analyses a digit drawn by hand and predicts it using classification.
skills: [python, numpy]
stack: ["Python", "NumPy"]
repo: https://github.com/MBigaj/Digit_recognition_kohonen
demo: digits
---

A feed-forward neural network implemented from scratch and trained on the MNIST dataset. You draw a digit on a canvas and the network predicts which one it is.

The network is a NumPy implementation of a three-layer perceptron (784, 100 and 50 tanh units, 10 sigmoid outputs) trained with backpropagation. For this page it was trained once on the 60,000 MNIST training images and reaches 96.4 % accuracy on the 10,000 test images; the weights run in your browser below.
