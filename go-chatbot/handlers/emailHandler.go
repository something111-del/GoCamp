package handlers

import (
	"fmt"
	"log"

	"gopkg.in/gomail.v2"
)

func SendEmailNotification(userName, userEmail, initialMessage, sessionID string) {
	m := gomail.NewMessage()
	m.SetHeader("From", "karepalli123@gmail.com")
	m.SetHeader("To", "karepalli123@gmail.com")
	m.SetHeader("Subject", "New Live Chat Request - GoCamp")

	body := fmt.Sprintf(`
		<h2>New Live Chat Request</h2>
		<p><strong>User:</strong> %s</p>
		<p><strong>Email:</strong> %s</p>
		<p><strong>Initial Message:</strong></p>
		<p>%s</p>
		<p><strong>Session ID:</strong> %s</p>
		<hr>
		<p>Login to your dashboard to respond: <a href="http://localhost:3000/dashboard">Dashboard</a></p>
	`, userName, userEmail, initialMessage, sessionID)

	m.SetBody("text/html", body)

	d := gomail.NewDialer("smtp.gmail.com", 587, "karepalli123@gmail.com", "ehjicrjiycpjcdhw")

	if err := d.DialAndSend(m); err != nil {
		log.Printf("Failed to send email: %v", err)
	} else {
		log.Println("Email notification sent successfully")
	}
}
