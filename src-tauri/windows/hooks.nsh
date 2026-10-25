!macro NSIS_HOOK_POSTINSTALL
  ; Mueve la DLL de resources a la carpeta raíz del ejecutable
  CopyFiles "$INSTDIR\resources\WebView2Loader.dll" "$INSTDIR"
!macroend
