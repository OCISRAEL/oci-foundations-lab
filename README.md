# OCI Foundation Workshop - The Lab

## STEP 1 : Create Compartment
### Objective: Create a compartment to logically organize cloud resources.

1. Open the navigation menu and click **Identity & Security**. Under **Identity**, click **Compartments**

<img src="./SS/compartment/1.png" alt="drawing" width="600">

2. To create the compartment in the tenancy (root compartment) click **Create Compartment**

3. Enter the following information:
    1. **Name:** demo
    2. **Description:** demo compartment
    3. **Parent Compartment:** Keep the default value which is the root compartment
    4. **Tags:** Skip this option

4. Click **Create Compartment**

## STEP 2 : Create VCN
### Objective: Create a Virtual Cloud Network (VCN) with necessary subnets, routing, security rules & gateways

1. Open the navigation menu and click **Networking** &rarr; **Virtual Cloud Networks** 

2. Click on **Action** -> **Start VCN Wizard**

    ![drawing](./SS/vcn/1.png)

3. Choose **Create VCN with Internet Connectivity**

    ![drawing](./SS/vcn/2.png)

4. Fill the name of the VCN and leave everything else as **Default**

    ![drawing](./SS/vcn/3.png)

5. Scrolldown and click on **Next**

6. Review and click on **Create**

     ![drawing](./SS/vcn/4.png)

7. Once done, click on **View VCN** to see your new Virtual Cloud Network

    ![drawing](./SS/vcn/5.png) 

## STEP 3 : Create Compute Instance
### Objective: Create a compute instance with public Access

1. Open the navigation menu and click **Compute** &rarr; **Instances**

2. In the Compartment dropdown, choose **demo**, then click **Create Instance**

    ![drawing](./SS/compute/1.png)

3. Enter a name for the instance

    ![drawing](./SS/compute/2.png)

4. Under **Image and Shape** section, keep the default **Oracle Linux** image

    ![drawing](./SS/compute/3.png)

5. In the **Shape** section, click **Change Shape**

6. Choose  **AMD** -> **VM.Standard.E4.Flex** with **1 OCPU** and **8 GB of Memory**

![drawing](./SS/compute/4.png)

7. Click on **Advanced options** and scroll down until you reach **Oracle Cloud Agent**. Add the following to your stack:

![drawing](./SS/compute/5.png)

8. Click **Next** to reach **Networking**

9. For **Primary Network**, select the VCN we created earlier today. Under Subnet, choose its **Private Subnet**.

     ![drawing](./SS/compute/6.png)

10. Scroll down and Click **Download Private Key** (required) to save it on your computer ⚠️ You will need it later !!⚠️. Optionally, **Download Public Key** if you plan to reuse it later.

    ![drawing](./SS/compute/7.png)

11. Click **Next** to reach **Create**. Review and click

12. Once done. Find and copy the assigned **Private IPv4 address** and save it for later use

    ![drawing](./SS/compute/8.png)


## STEP 4 : Connect to your VM via OCI Cloud Shell
### Objective: Access your compute instance securely using OCI Cloud Shell.

1. Click on **Cloud Shell** in the top-right corner of the OCI Console

    ![drawing](./SS/cloud_shell/1.png)

2. Wait for **Cloud Shell** window to open

3. In the Cloud Shell toolbar, click **Network -> Ephermal Private Network**

    ![drawing](./SS/cloud_shell/2.png)

4. Select your **Private Subnet** in **VCN-demo**

    ![drawing](./SS/cloud_shell/3.png)

5. Click **Use as active network**

6. Wait for Network settings to update.

7. Click on **Upload** from the Cloud Shell menu

    ![drawing](./SS/cloud_shell/4.png)

8. Upload your private key file from **STEP 3**

    ![drawing](./SS/cloud_shell/5.png)

9. Verify that the key was uploaded successfully
    ```
    ls -lth
    ```

10. update file permission:
    ```
    chmod 400 <private_key_file>
    ```

11. Run the following SSH command with the private IP address of your instance to connect:
    ```
    ssh -i <ssh-private-key> opc@<vm-private-ip>
    ```

12. You should now be connected to your VM

    ![drawing](./SS/cloud_shell/6.png)      

13. 💡 You can minimize Cloud Shell and restore it whenever you need it again

## STEP 5 : Create a Block Volume 
### Objective: Create a block volume and attach it to the compute instance.

1. Open the navigation menu and click **Storage**. Under **Block Storage**, click **Block Volumes**

2. Click **Create block volume**

    ![drawing](./SS/block_volume/1.png)

3. Provide the following values: <br>
    (1) **Name:** BV-demo<br>
    (2) **Create in compartment:** demo <br>
    (3) Under **Volume size and performance** select **Custom** and enter **Volume size** of *50GB*.

    ![drawing](./SS/block_volume/2.png)

4. Keep all values **Default**, and click **Create Block Volume**. <br>

### Attaching the Block Volume to an Instance

1. Open the new **Block Volume** we just created

2. In the top panel click the **Attached Instances** tab, then click **Attach to Instance**

    ![drawing](./SS/block_volume/3.png)

3. Provide the following values: <br>
    (1) **Attachment type**: ISCSI <br>
    (2) **Access Type**: Read/Write <br>
    (3) From the **instance** dropdown list, select your compute instance<br>
    (4) Check **Use Oracle Cloud Agent to automatically connect to iSCSI-attached volumes** box <br>

    ![drawing](./SS/block_volume/4.png)

4. Click **Attach**

5. Once ready. your instance will appear in the list:

    ![drawing](./SS/block_volume/5.png)

6. Connect to the instance via **Cloud Shell** as desribed in **STEP 4**

7. Verify that the disk has been successfully attached by executing the following command:
    ```
    sudo lsblk
    ```
    ```⚠️Note: the device name /dev/sdb may differ depending on your setup. Use the output of lsblk to confirm⚠️```
    
    ![drawing](./SS/block_volume/6.png)

8. Format and mount the volume by executing the following commands:
    ```
    sudo mkfs.ext4 /dev/sdb
    sudo mkdir /mnt/data
    sudo mount /dev/sdb /mnt/data
    ```

9. Run the following command to verify that the disk appears in the list:
    ```
    df -h
    ```

    ![drawing](./SS/block_volume/7.png)

## STEP 6 : Create Dynamic Group and Policies
### Objective: Allow OCI resources to access required services using identity-based rules.

1. First, make sure you're using the right region - Israel Central (Jerusalem)

   ![drawing](./SS/lab2/1.png)

2. Open the navigation menu and click **Identity & Security** → **Identity** → **Compartments**

3. Select **demo** compartment

4. Copy the full OCID string of **demo** compartment. ⚠️ Save it - you'll need it later ⚠️

    ![drawing](./SS/lab2/2.png)

5. Open the navigation menu and click **Identity & Security**. Under **Identity**, click **Domains**

6. Select **root** compartment, then select the **Default** domain

   ![drawing](./SS/lab2/3.png)

7. Move to **Dynamic groups** tab, then click **Create dynamic group**

   ![drawing](./SS/lab2/4.png)

8. Enter the following:

   1. **Name:** dg-demo  
   2. **Description (optional):** Dynamic Group for demo compartment  
   3. Under **Matching rules** click **Rule Builder** and follow:  

      1. **Include instances that match:** Any of the following  
      2. **Match instances with:** Compartment OCID  
      3. **Value:** Enter your compartment OCID  
      4. Click **Add Rule**  

      ![drawing](./SS/lab2/5.png)

   4. The rule should look similar to the following:

      ```
      Any {instance.compartment.id = '<your_compartment_ocid>'}
      ```

    5. Click **Create**

9. Next, we need to give the dynamic group IAM permissions. 
        
10. Select **Policies** on the left menu, then click **Create Policy**

    ![drawing](./SS/lab2/6.png)

11. Enter the following:

    1. **Name:** dg-policy-demo
    2. **Description (optional):** Dynamic Group IAM policy
    3. **Compartment:** root
    4. Switch the **Show manual editor** and add the following policies:

            Allow dynamic-group <your_dg_name> to manage object-family in compartment <your_compartment_name>
    
    5. Click **Create**

    ```⚠️Note: The new policies will go into effect typically within 10 seconds ⚠️```

    ![drawing](./SS/lab2/7.png)

## STEP 7 : Create Bucket
### Objective: Create an Object Storage bucket to store data.

1. Click **Storage** &rarr; **Object Storage & Archive Storage** &rarr; **Buckets**

2. Select **demo** compartment, then click **Create Bucket**

    ![drawing](./SS/lab2/8.png)

3. Enter a name for your bucket,then click **Create bucket** <br>

```⚠️Note: Save the bucket's name, you'll need it later⚠️```
    ![drawing](./SS/lab2/9.png)
   
## STEP 8 : Create ADB (Autonomous AI Database)
### Objective: Provision an Autonomous AI Database to store and manage workshop data.

1. Open the navigation menu and click **Oracle AI Database** &rarr; **Autonomous AI Database** 

2. Click **Create Autonomous AI Database** (make sure you're in the right compartment)

    ![drawing](./SS/lab2/10.png)

3. Enter the following:
    
    1. **Display name:** adb-demo
    2. **Database name:** adbdbdemo
    3. **Compartment:** demo
    4. For the workload type, choose **JSON**
    5. Switch **Devloper Mode** to ON and Leave **database version** with default value: 19c
    6. Set the password for the ADMIN database user in your new database - ⚠️**Don't use @ in password**⚠️
    7. **Access type:** Secure access from allowed IPs and VCNs only
    8. Set **IP notation type:** CIDR block & **Value:** 0.0.0.0/0 - ⚠️**For testing purpose only**⚠️
    9. Skip on the **Contacts** section and click **Create**

4. Wait until your new Autonomous Database's status changes from **Provisioning** to **Available**

5.  Select the **Tool configuration** tab on the Autonomous Database details page

    ![drawing](./SS/lab2/11.png)

6. Scroll down the Tool configuration page until you find the **MongoDB API**

8. Copy the connection string under **Public access URL** and edit it as follow:

    ![drawing](./SS/lab2/12.png)

    Instead of **[user:password@]** & **[user]** 
        
    1. enter your database username and password **(Without the '[]'. With the @)**

    2. Instead of **[user]** enter your database admin user **(Without the '[]')**

    It should looks like: *mongodb://**ADMIN**:**password**@G0D09E...F.adb.il-jerusalem-1.oraclecloudapps.com:27017/**ADMIN**?authMechanism...true*

    ```⚠️Note: Your string name may differ depending on your setup⚠️```

9. ⚠️ Save the full updated string - you'll need it later ⚠️

10. Scroll up & Click **Database actions** and then **View all database actions**.

    ![drawing](./SS/lab2/13.png)

11. Now, let's add a new collection to your database by clicking &nbsp; **{ } JSON** &nbsp; under the Development section and then **Open**.

    ![drawing](./SS/lab2/14.png)

8. Click **Create Collection**

    ![drawing](./SS/lab2/15.png)

8. Enter the following:
    
    1. **Collection Name:** collection-demo - ⚠️Save it. You'll need it later⚠️
    2. Click **Create**

    ![drawing](./SS/lab2/16.png)


 ## STEP 9 : Configure Network Access
 ### Objective: Open the required port (5000) in the VCN to allow inbound application traffic.

1. Open the navigation menu and click **Networking** &rarr; **Virtual Cloud Networks**

2. Select the VCN we created earlier **VCN-demo**

3. Follow those steps for each of the **private** & **public** subnets in your VCN:

    1. In the **Subnets** tab, click **private subnet/public-<your_vcn_name>**

    2. In the **Security** tab, click **security list for private subnet/Default Security List for-<your_vcn_name>>**

    3. Select **Security rules** tab

    4. Click **Add Ingress Rules** to save

    5. Enter the following:
    
        1. **Source Type:** CIDR
        2. **Source CIDR:** 0.0.0.0/0
        3. **IP Protocol:** TCP
        4. **Destination Port Range:** 5000
        5. Click **Add Ingress Rules**

4. The newly created rules will be added to your security rules list of both subnets!

    ![drawing](./SS/lab2/19.png)
    ![drawing](./SS/lab2/20.png)

## STEP 10 : Create Load Balancer
### Objective: Allow users to access the internal web application through an OCI load balancer

1. Open the navigation menu and click **Networking** &rarr; **Load Balancer**

2. Click **Create load balancer**

    ![drawing](./SS/lab2/21.png)

3. Provide the following details:

    1. **Name:** lb-demo
    2. **Visibility:** Public
    3. **Assign a public IP address:** Ephemeral
    4. **Virtual Cloud Network:** VCN-demo
    5. **Subnet:** public subnet

4. Click **Next**

5. Select backend servers by clicking **Add instances**

6. Choose your instance from the list

    ![drawing](./SS/lab2/22.png)

7. Change the instace port to **5000**

8. Specify the following **Health Check Policy:**

    1. **Protocol:** TCP
    2. **Port:** 22
    3. Leave all other options with their default values

9. Set **Backend Set** name to: bs-demo

10. Click **Next**

11. Set Listener details:

    1. **Name:** lb-listener-5000
    2. **Type of Traffic:** HTTP
    3. **Port:** 5000
    4. Leave all other options with their default values

12. Click **Next**

13. Disable **Error Logs**

14. Click **Next** , Review the configuration and click **Submit**

15. Wait for the Load Balancer to finish provisioning and become **Healthy**

16. Retrieve the **Load Balancer** public **IP Address** from the details tab

    ![drawing](./SS/lab2/23.png)

⚠️Save this IP address. You'll need it later⚠️

## STEP 11 : Retrieve Workshop Code
### Objective: Clone the required Git repository to access the workshop files.

1. Use **STEP 4** instruction to connect to your instance private **IP Address**

2. Switch to root user by running the following command:    

        sudo su

3. After you connected to your machine, install git by running the following command:    

        yum install git

4. Now, clone the git repository by running the following command:    

        git clone https://github.com/OCISRAEL/oci-foundations-lab


## STEP 12 : Update Configuration
### Objective: Modify the config file to set the required workshop parameters.

1. Change directory to the cloned folder:    

        cd oci-foundations-lab

2. Run the following command to edit the config file:

        vi flask/config.txt

3. The file will look like that:

        {
        "CONNECTION_STRING": "<DB_CONNECTION_STRING>",
        "bucketName": "<BUCKET_NAME>",
        "coll_name": "<COLLECTION_NAME>"
        }

4. Press on "**i**" key to edit the file and change the following:
    
    1. **"CONNECTION_STRING":** Replace <DB_CONNECTION_STRING> with your **Mongo DB's** connection string (inside the quotation marks)
    2. **"bucketName":** Replace <BUCKET_NAME> with your bucket's name (inside the quotation marks)
    3. **"coll_name":** Replace <COLLECTION_NAME> with your collection's name (inside the quotation marks)

5. After you've finished editing, press the "**esc**" key, then **"shift" + ":"** , then write **:wq** and finally press the "**enter**" key to save your changes

6. Verify that the file changes has been saved

## STEP 13 : Run The Application
### Objective: Start the application to validate the setup and confirm everything is functioning correctly.

1. Install pip

        sudo yum install -y python3-pip

2. Install all of the packages listed in the "requirements.txt" file:

        pip3 install -r requirements.txt

3. Run the following commands to open port 5000 in the Linux firewall:

    1.      sudo firewall-cmd --permanent --zone=public --add-port=5000/tcp
    2.      sudo firewall-cmd --reload

you should get **sucess** on both times

3. Run the following command to run the application:

        python3 flask/OCIFundamentalWorkshop-Instance.py

4. Navigate to the address **http://<your_load_balancer_public_ip>:5000** in your browser and start uploading!


* **If you get the errors "address already in use" or "the server couldnt be started, because another server runs on that port", simply run the following command:**

        sudo kill -9 $(sudo lsof -t -i:5000)


## STEP 14 : Review The Application
### Objective: Verify the application’s behavior and ensure all components are working as expected.

1. Once you have successfully completed all these steps, your web application should look like this:

   ![drawing](./SS/app_ss.png)

2. Upload a test file to the app and confirm it was successful.

3. Check your **bucket**. Do you see the uploaded file?

4. Check your **Autonomous Database** JSON collection. Do you see a new entry?