import interception
import time

time.sleep(3)
interception.key_down('w')
time.sleep(0.2)
interception.key_up('w')
interception.key_down('w')
time.sleep(0.2)
interception.key_up('w')
print("enviado")