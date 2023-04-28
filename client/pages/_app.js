import '../styles/globals.css';
import "../styles/articleView.css";
import { ThemeProvider } from "styled-components"
import { lightTheme, darkTheme, GlobalStyles } from "./ThemeConfig" 

import 'bootstrap/dist/css/bootstrap.css'

export default function App({Component, pageProps})
{
    return(
        <ThemeProvider theme={lightTheme}>
      <GlobalStyles />
      <Component {...pageProps} />
    </ThemeProvider>
        )
}