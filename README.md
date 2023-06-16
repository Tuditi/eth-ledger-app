# Ethereum Ledger Device Interactions

This repository contains a collection of scripts designed to test Ethereum interactions with a ledger device and/or Electron. The scripts are written in TypeScript.

## Table of Contents

- [Overview](#overview)
- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Overview

The scripts in this repository aim to demonstrate how to interact with a ledger device when working with Ethereum and the IOTA Smart Contract Protocol. They provide examples of various interactions such as address generation and transaction signing. These scripts can serve as a starting point for developers who wish to integrate ledger device support into their Ethereum applications or perform testing and experimentation.

## Requirements

To use these scripts, you need to have the following requirements installed:

- [Node.js](https://nodejs.org/en) (version 18.x or higher)
- A compatible Ethereum ledger device (e.g., Ledger Nano S or Ledger Nano X)

## Installation

To install the required dependencies, follow these steps:

1. Clone this repository to your local machine:

   ```bash
   git clone https://github.com/Tuditi/eth-ledger-app.git
   ```

2. Install the dependencies from the root folder:

   ```bash
   yarn
   ```

## Usage

Before running the scripts, ensure that your ledger device is connected and accessible. Follow these steps to use the scripts:

1. Connect your ledger device to your computer via USB.

2. Unlock your device.

3. Run the desired script using the following command:

   ```bash
   yarn script:script_name
   ```

   Replace `script_name` with the name of the script you want to execute.

4. Follow the on-screen instructions provided by the script. The script will interact with your ledger device for necessary operations such as signing transactions or confirming actions.

## Contributing

Contributions to this repository are welcome! If you want to contribute, please follow these steps:

1. Fork this repository.

2. Create a new branch for your feature or bug fix:

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. Make your changes and commit them:

   ```bash
   git commit -m "Add your commit message here"
   ```

4. Push your changes to your fork:

   ```bash
   git push origin feature/your-feature-name
   ```

5. Open a pull request on this repository, comparing your branch with the `main` branch.
