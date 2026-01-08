GOOS ?= linux
GOARCH ?= amd64

PORT ?= 4000
DATA_FOLDER ?= _data

.PHONY: all build-nuxt build-go package clean dev dev-nuxt dev-go

all: package

build-nuxt:
	cd web && bun install && bun run generate

build-go:
	go mod tidy
	GOOS=$(GOOS) GOARCH=$(GOARCH) go build -o app cmd/server/main.go

package: build-nuxt build-go
	rm -rf dist
	mkdir -p dist
	cp app dist/
	mkdir -p dist/web
	cp -r web/dist/* dist/web
	rm -rf web/dist web/.output app

dev: dev-nuxt dev-go

dev-nuxt:
	cd web && bun install && SERVER_PORT=$(PORT) bun run dev

dev-go:
	PORT=$(PORT) DATA_FOLDER=$(DATA_FOLDER) go run cmd/server/main.go

clean:
	rm -rf dist app web/node_modules web/.output web/dist web/.nuxt
