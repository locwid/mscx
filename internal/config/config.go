package config

import (
	"errors"
	"io/fs"
	"os"
	"path/filepath"
)

const folderPermission = 0755

type config struct {
	port        string
	dataFolder  string
	filesFolder string
	dbName      string
}

var cfg config

func InitConfig() {
	port := os.Getenv("PORT")
	dataFolder := os.Getenv("DATA_FOLDER")

	if port == "" {
		panic("PORT environment variable is required")
	}
	if dataFolder == "" {
		panic("DATA_FOLDER environment variable is required")
	}

	cfg = config{
		port:        port,
		dataFolder:  dataFolder,
		filesFolder: "files",
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
}

func GetPort() string {
	return cfg.port
}

func GetFilesDir() string {
	return filepath.Join(cfg.dataFolder, cfg.filesFolder)
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
