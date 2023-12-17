# Nens 

API with Node, Express, NemJS & SQL

[![NPM Version](https://badgen.net/npm/v/nens)](https://www.npmjs.com/package/nens)
[![NPM Downloads](https://badgen.net/npm/dt/nens)](https://www.npmjs.com/package/nens)

[![GitHub Last Commit](https://badgen.net/github/last-commit/philippebeck/nens)](https://github.com/philippebeck/nens/commits/master)

[![GitHub Top Language](https://img.shields.io/github/languages/top/philippebeck/nens)](https://github.com/philippebeck/nens)
[![Code Size](https://img.shields.io/github/languages/code-size/philippebeck/nens)](https://github.com/philippebeck/nens/tree/master)

## Overview

**Warning : This is an alpha version in development, the API is not ready yet.**

Nens is an API made with Node, Express & MySQL, where you can find an "homemade" package complementary, NemJS, for JWT, Nodemailer, Sharp & back securities, as the backend services  

## Summary

- [Nens](#nens)
  - [Overview](#overview)
  - [Summary](#summary)
  - [Download](#download)
  - [Package](#package)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Usage](#usage)
  - [Content](#content)
  - [Documentation](#documentation)

---

## Download

[Use this Template](https://github.com/philippebeck/nens/generate)  
or  
`git clone https://github.com/philippebeck/nens.git`  
or  
[Latest Release](https://github.com/philippebeck/nens/releases)  

---

## Package

NPM : `npm i nens`  
or  
Yarn : `yarn add nens`  

**If you choose to get Nens from NPM or Yarn : you need to copy Nens from *node_modules/nens* to the root of your App**

---

## Installation

Install the backend dependencies :  
`$ cd nens`  
`$ npm i`  

---

## Configuration

To configure the backend, replace values :  
`.env.en  || .env.fr` *(then rename it .env)*  

---

## Usage

To run the backend server :  
`$ npm start`  

---
## Content

Available API Files :
-  **ProductModel, ProductCtrl, ProductRoute** *(Products)*  
-  **OrderModel, OrderCtrl, OrderRoute** *(Product Orders)*  
-  **ArticleModel, ArticleCtrl, ArticleRoute** *(Articles)*  
-  **GalleryModel, GalleryCtrl, GalleryRoute** *(Galleries)*  
-  **ImageModel, ImageCtrl, ImageRoute** *(Gallery Images)*  
-  **AuthCtrl, AuthRoute** *(Auth)*  
-  **UserModel, UserCtrl, UserRoute** *(Users)*  
-  **LinkModel, LinkCtrl, LinkRoute** *(Links)*  

---

## Documentation

Available Documentation :  
-  [**API**](https://github.com/philippebeck/nens/tree/master/swagger.yaml)  

Available Readme :  
-  [**NemJS**](https://github.com/philippebeck/nemjs)  
