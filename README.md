# Sen 

API with SQL, Express & NemJS

[![NPM Version](https://badgen.net/npm/v/sen)](https://www.npmjs.com/package/sen)
[![NPM Downloads](https://badgen.net/npm/dt/sen)](https://www.npmjs.com/package/sen)

[![GitHub Last Commit](https://badgen.net/github/last-commit/philippebeck/sen)](https://github.com/philippebeck/sen/commits/master)

[![Maintainability](https://api.codeclimate.com/v1/badges/c2938393c028dc63505a/maintainability)](https://codeclimate.com/github/philippebeck/sen/maintainability)

[![GitHub Top Language](https://img.shields.io/github/languages/top/philippebeck/sen)](https://github.com/philippebeck/sen)
[![Code Size](https://img.shields.io/github/languages/code-size/philippebeck/sen)](https://github.com/philippebeck/sen/tree/master)

## Overview

**Warning : This is an alpha version in development, the API is not ready yet.**

Sen is an API made with Node/Express & MySQL, where you can find an "homemade" package complementary, Nemjs, for JWT, Nodemailer, Sharp & back securities, as the backend services  

## Summary

- [Sen](#sen)
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

[Use this Template](https://github.com/philippebeck/sen/generate)  
or  
`git clone https://github.com/philippebeck/sen.git`  
or  
[Latest Release](https://github.com/philippebeck/sen/releases)  

---

## Package

NPM : `npm i sen`  
or  
Yarn : `yarn add sen`  

**If you choose to get Sen from NPM or Yarn : you need to copy Sen from *node_modules/sen* to the root of your App**

---

## Installation

Install the backend dependencies :  
`$ cd sen`  
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
-  [**API**](https://github.com/philippebeck/sen/tree/master/swagger.yaml)..

Available Readme :  
-  [**NemJS**](https://github.com/philippebeck/nemjs)  
