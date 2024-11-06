package com.webview.disney

import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.view.View
import android.view.View.OnAttachStateChangeListener
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.tv.material3.Button
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.Text
import com.webview.disney.ui.theme.DisneyTheme
import org.mozilla.geckoview.GeckoResult
import org.mozilla.geckoview.GeckoRuntime
import org.mozilla.geckoview.GeckoRuntimeSettings
import org.mozilla.geckoview.GeckoSession
import org.mozilla.geckoview.GeckoSession.ContentDelegate
import org.mozilla.geckoview.GeckoSession.NavigationDelegate
import org.mozilla.geckoview.GeckoSession.PermissionDelegate
import org.mozilla.geckoview.GeckoSessionSettings
import org.mozilla.geckoview.GeckoView
import org.mozilla.geckoview.WebExtension
import org.mozilla.geckoview.WebResponse


class MainActivity : ComponentActivity() {
    private lateinit var geckoSession: GeckoSession
    private lateinit var geckoRuntime: GeckoRuntime

    // Déclaration de `loadError` comme attribut privé de la classe
    private var loadError by mutableStateOf(false)
    private var canGoBack = false

    @OptIn(ExperimentalTvMaterial3Api::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val runtimeSettings = GeckoRuntimeSettings.Builder()
            .javaScriptEnabled(true)
            //.remoteDebuggingEnabled(true)
            //.consoleOutput(true)
            //.debugLogging(false)
            .globalPrivacyControlEnabled(true)
            .extensionsWebAPIEnabled(true)
            .build()
        ;

        // Initialisez GeckoRuntime
        geckoRuntime = GeckoRuntime.create(this, runtimeSettings)

        geckoRuntime.webExtensionController.installBuiltIn("resource://android/assets/customExtension/")
            .accept({ extension ->
                Log.i("webExtensionController", "Extension installed: " + extension)
            }, { exception ->
                Log.e("webExtensionController",
                    "Exception message from WebExtension: $exception"
                )
            })

        val sessionSettings = GeckoSessionSettings.Builder()
            .allowJavascript(true)
            .usePrivateMode(false)
            .userAgentOverride("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36")
            .build()


        // Initialisez GeckoSession et définissez un délégué de progression pour surveiller les erreurs de chargement
        geckoSession = GeckoSession(sessionSettings).apply {
            // Active les DRM
            permissionDelegate = object: PermissionDelegate {
                override fun onContentPermissionRequest(
                    session: GeckoSession,
                    perm: GeckoSession.PermissionDelegate.ContentPermission
                ): GeckoResult<Int>? {
                    return GeckoResult.fromValue(GeckoSession.PermissionDelegate.ContentPermission.VALUE_ALLOW)
                }
            }
            progressDelegate = object : GeckoSession.ProgressDelegate {
                override fun onPageStop(session: GeckoSession, success: Boolean) {
                    if (success) {
                        Log.i("GeckoWebView", "Loading success")
                    } else {
                        Log.e("GeckoWebView", "Error loading page "+session)
                    }
                }
                override fun onPageStart(session: GeckoSession, url: String) {
                    Log.i("GeckoWebView", "Page started loading: $url")
                }
            }
            contentDelegate = object : ContentDelegate {
                override fun onCrash(session: GeckoSession) {
                    Log.e("GeckoWebView", "Page crash")
                    loadError = true
                }

                override fun onExternalResponse(session: GeckoSession, response: WebResponse) {
                    Log.d("GeckoWebView", "External response received: ${response.uri}")
                }
            }
            navigationDelegate = object: NavigationDelegate {
                override fun onCanGoBack(session: GeckoSession, cgb: Boolean) {
                    canGoBack = cgb;
                    super.onCanGoBack(session, cgb)
                }
            }
            open(geckoRuntime)
            setFocused(true)
        }

        val data: Uri? = intent?.data
        val initialUrl = data?.toString() ?: "https://www.disneyplus.com/fr-fr"

        setContent {
            DisneyTheme {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color.Black),
                ) {
                    GeckoWebView(initialUrl)
                }
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        geckoSession.close()
        geckoRuntime.shutdown() // Fermez GeckoRuntime pour libérer les ressources
    }


    override fun onBackPressed() {
        // Vérifier si le GeckoSession a une page précédente dans l'historique
        if (canGoBack) {
            geckoSession.goBack() // Revenir à la page précédente
        } else {
            super.onBackPressed() // Quitter l'application si aucune page précédente
        }
    }

    @Composable
    fun GeckoWebView(url: String) {
        // Configurer le délégué pour surveiller les erreurs de chargement
        LaunchedEffect(url) {
            geckoSession.loadUri(url);
            geckoSession.setFocused(true);
        }

        if (loadError) {
            // Afficher le message d'erreur avec le bouton de rechargement
            Column(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text("Échec du chargement de la page")
                Spacer(modifier = Modifier.height(16.dp))
                Button(onClick = {
                    loadError = false
                    geckoSession.loadUri(url);
                    geckoSession.setFocused(true);
                }) {
                    Text("Recharger")
                }
            }
        } else {
            // Afficher le GeckoView si la page charge normalement
            AndroidView(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black),
                factory = { context ->
                    GeckoView(context).apply {
                        Log.d("GeckoWebView", "Initialize GeckoView")
                        setSession(geckoSession)
                        setBackgroundColor(android.graphics.Color.BLACK)
                        addOnAttachStateChangeListener(object: OnAttachStateChangeListener {
                            override fun onViewAttachedToWindow(v: View) {
                                v.requestFocus()
                                Log.d("GeckoWebView", "GeckoView attached to window.");
                            }

                            override fun onViewDetachedFromWindow(v: View) {
                                Log.d("GeckoWebView", "GeckoView detached from window.");
                            }
                        })
                    }
                },
                update = { geckoView ->
                    geckoView.setSession(geckoSession)
                    geckoView.requestFocus()
                    geckoSession.setFocused(true);
                }
            )
        }
    }
}

