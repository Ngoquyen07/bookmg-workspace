@echo off
start "BookMG Backend" /D "%~dp0..\bookmg-repo-be" cmd /k "npm.cmd run dev"
start "BookMG Frontend" /D "%~dp0..\bookmg-repo-fe" cmd /k "npm.cmd run dev"
