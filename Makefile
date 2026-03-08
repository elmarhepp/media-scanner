SHELL := /bin/zsh

PROJECT_DIR := rss-reader-vue-project
NPM := npm

.PHONY: help install dev build preview test clean

help:
	@echo "Available targets:"
	@echo "  make install   - Install dependencies"
	@echo "  make dev       - Start local dev server"
	@echo "  make build     - Build production bundle"
	@echo "  make preview   - Preview production build locally"
	@echo "  make test      - Run local validation (build)"
	@echo "  make clean     - Remove build output"

install:
	cd $(PROJECT_DIR) && $(NPM) install

dev:
	cd $(PROJECT_DIR) && $(NPM) run dev

build:
	cd $(PROJECT_DIR) && $(NPM) run build

preview:
	cd $(PROJECT_DIR) && $(NPM) run preview

test: build
	@echo "Local test passed: production build completed successfully."

clean:
	cd $(PROJECT_DIR) && rm -rf dist
