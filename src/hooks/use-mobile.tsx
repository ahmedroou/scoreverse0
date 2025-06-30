import { useState, useEffect } from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false) // Default to a consistent value on server

  useEffect(() => {
    // This effect runs only on the client
    const checkSize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    checkSize() // Initial check on the client
    window.addEventListener("resize", checkSize)

    // Cleanup listener on component unmount
    return () => window.removeEventListener("resize", checkSize)
  }, []) // Empty dependency array ensures this runs only once on mount

  return isMobile
}
