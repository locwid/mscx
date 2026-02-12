package config

import (
	"errors"
	"io/fs"
	"os"
	"path/filepath"
)

const folderPermission = 0755

type Config struct {
	port        string
	dataFolder  string
	filesFolder string
	tempFolder  string
	dbName      string
	authKey     string
}

var cfg Config

func InitConfig() {
	port := os.Getenv("PORT")
	dataFolder := os.Getenv("DATA_FOLDER")
	authKey := os.Getenv("AUTH_KEY")

	if port == "" {
		panic("PORT environment variable is required")
	}
	if dataFolder == "" {
		panic("DATA_FOLDER environment variable is required")
	}
	if authKey == "" {
		panic("AUTH_KEY environment variable is required")
	}

	cfg = Config{
		port:        port,
		dataFolder:  dataFolder,
		authKey:     authKey,
		filesFolder: "files",
		tempFolder:  "temp",
		dbName:      "data.db",
	}

	exists, _ := dirExsists(cfg.dataFolder)
	if !exists {
		err := os.Mkdir(cfg.dataFolder, folderPermission)
		if err != nil {
			panic("Failed to create data folder")
		}
	}

	exists, _ = dirExsists(filepath.Join(cfg.dataFolder, cfg.filesFolder))
	if !exists {
		err := os.Mkdir(filepath.Join(cfg.dataFolder, cfg.filesFolder), folderPermission)
		if err != nil {
			panic("Failed to create files folder")
		}
	}

	exists, _ = dirExsists(filepath.Join(cfg.dataFolder, cfg.tempFolder))
	if !exists {
		err := os.Mkdir(filepath.Join(cfg.dataFolder, cfg.tempFolder), folderPermission)
		if err != nil {
			panic("Failed to create temp folder")
		}
	}
}

func GetAuthKey() string {
	return cfg.authKey
}

func GetPort() string {
	return cfg.port
}

func GetFilesDir() string {
	return filepath.Join(cfg.dataFolder, cfg.filesFolder)
}

func GetTempDir() string {
	return filepath.Join(cfg.dataFolder, cfg.tempFolder)
}

func GetFilePath(filename string) string {
	return filepath.Join(GetFilesDir(), filename)
}

func GetDbPath() string {
	return filepath.Join(cfg.dataFolder, cfg.dbName)
}

func dirExsists(path string) (bool, error) {
	_, err := os.Stat(path)
	if err == nil {
		return true, nil
	}
	if errors.Is(err, fs.ErrNotExist) {
		return false, nil
	}
	return false, err
}
